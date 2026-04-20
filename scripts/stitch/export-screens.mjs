import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const workspaceRoot = process.cwd();
const defaultManifestPath = path.join(workspaceRoot, 'scripts', 'stitch', 'welcome-to-incubation-program.json');
const manifestPath = process.argv[2] ? path.resolve(workspaceRoot, process.argv[2]) : defaultManifestPath;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extensionFromMimeType(mimeType, fallback) {
  if (!mimeType) {
    return fallback;
  }

  const knownExtensions = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'text/html': '.html',
    'text/plain': '.txt',
    'application/json': '.json',
    'application/pdf': '.pdf',
    'image/svg+xml': '.svg'
  };

  return knownExtensions[mimeType] ?? fallback;
}

function parseToolResult(result) {
  if (!result) {
    return null;
  }

  if (result.structuredContent && typeof result.structuredContent === 'object') {
    return result.structuredContent;
  }

  if (result.content && Array.isArray(result.content)) {
    for (const item of result.content) {
      if (item && typeof item === 'object') {
        if (item.json && typeof item.json === 'object') {
          return item.json;
        }

        if (typeof item.text === 'string') {
          const trimmedText = item.text.trim();

          if (!trimmedText) {
            continue;
          }

          try {
            return JSON.parse(trimmedText);
          } catch {
            continue;
          }
        }
      }
    }
  }

  if (result.name || result.screenshot || result.htmlCode) {
    return result;
  }

  return null;
}

function downloadWithCurl(url, outputPath) {
  const curlArgs = ['-fsSL', '-L', '--output', outputPath];

  curlArgs.push(url);

  const curlResult = spawnSync('curl', curlArgs, {
    cwd: workspaceRoot,
    encoding: 'utf8'
  });

  if (curlResult.status !== 0) {
    const stderr = (curlResult.stderr || '').trim();
    throw new Error(stderr || `curl exited with status ${curlResult.status}`);
  }
}

async function callStitchTool(toolName, args, headers) {
  const response = await fetch('https://stitch.googleapis.com/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `${toolName}-${Date.now()}`,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    })
  });

  const responseText = await response.text();
  let responseJson = null;

  try {
    responseJson = JSON.parse(responseText);
  } catch {
    throw new Error(`Stitch returned a non-JSON response with status ${response.status}`);
  }

  if (!response.ok) {
    const errorMessage = responseJson?.error?.message || response.statusText;
    throw new Error(`Stitch HTTP ${response.status}: ${errorMessage}`);
  }

  if (responseJson.result?.isError) {
    const textMessage = responseJson.result.content
      ?.filter((entry) => typeof entry?.text === 'string')
      .map((entry) => entry.text.trim())
      .filter(Boolean)
      .join(' ');

    throw new Error(textMessage || 'Stitch returned an error result');
  }

  return responseJson;
}

async function main() {
  const stitchApiKey = process.env.STITCH_API_KEY;

  if (!stitchApiKey) {
    fail('Missing STITCH_API_KEY. Export your Stitch API key before running this script.');
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const projectId = manifest.project?.id;
  const projectTitle = manifest.project?.title;
  const screens = Array.isArray(manifest.screens) ? manifest.screens : [];

  if (!projectId || !projectTitle || screens.length === 0) {
    fail('The Stitch manifest is missing project metadata or screens.');
  }

  const outputRoot = path.join(workspaceRoot, 'output', 'stitch', slugify(projectTitle));
  const requestHeaders = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': stitchApiKey
  };

  await mkdir(outputRoot, { recursive: true });

  const exportIndex = {
    project: manifest.project,
    generatedAt: new Date().toISOString(),
    outputRoot: path.relative(workspaceRoot, outputRoot),
    screens: []
  };

  for (const screen of screens) {
    const screenName = `projects/${projectId}/screens/${screen.id}`;
    const directoryName = `${String(screen.order).padStart(2, '0')}-${slugify(screen.title)}-${screen.id.slice(0, 8)}`;
    const screenOutputDirectory = path.join(outputRoot, directoryName);

    await mkdir(screenOutputDirectory, { recursive: true });
    console.log(`Exporting screen ${screen.order}/${screens.length}: ${screen.title} (${screen.id})`);

    const rawResponse = await callStitchTool(
      'get_screen',
      {
        name: screenName,
        projectId,
        screenId: screen.id
      },
      requestHeaders
    );

    await writeFile(
      path.join(screenOutputDirectory, 'raw-response.json'),
      `${JSON.stringify(rawResponse, null, 2)}\n`,
      'utf8'
    );

    const normalizedScreen = parseToolResult(rawResponse.result);

    if (!normalizedScreen) {
      throw new Error(`Unable to extract structured screen data for ${screenName}`);
    }

    await writeFile(
      path.join(screenOutputDirectory, 'screen.json'),
      `${JSON.stringify(normalizedScreen, null, 2)}\n`,
      'utf8'
    );

    const downloadedFiles = [];

    for (const [fieldName, fallbackExtension] of [
      ['screenshot', '.png'],
      ['htmlCode', '.html'],
      ['figmaExport', '.zip']
    ]) {
      const fileResource = normalizedScreen[fieldName];

      if (!fileResource?.downloadUrl) {
        continue;
      }

      const extension = extensionFromMimeType(fileResource.mimeType, fallbackExtension);
      const outputPath = path.join(screenOutputDirectory, `${fieldName}${extension}`);

      downloadWithCurl(fileResource.downloadUrl, outputPath);

      downloadedFiles.push({
        field: fieldName,
        mimeType: fileResource.mimeType || null,
        path: path.relative(workspaceRoot, outputPath)
      });
    }

    exportIndex.screens.push({
      order: screen.order,
      title: screen.title,
      id: screen.id,
      directory: path.relative(workspaceRoot, screenOutputDirectory),
      downloadedFiles,
      metadata: {
        name: normalizedScreen.name,
        title: normalizedScreen.title || screen.title,
        deviceType: normalizedScreen.deviceType || null,
        width: normalizedScreen.width || null,
        height: normalizedScreen.height || null
      }
    });
  }

  await writeFile(path.join(outputRoot, 'index.json'), `${JSON.stringify(exportIndex, null, 2)}\n`, 'utf8');
  console.log(`Finished exporting ${screens.length} Stitch screens to ${path.relative(workspaceRoot, outputRoot)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});