import bcrypt from 'bcryptjs';

import {
  authenticateUserBackedClaims,
  resolveUserBackedClaims,
} from '../routes/workers/userBackedClaims';

type TableRows = Record<string, unknown>[];

class FakePreparedStatement {
  private value: unknown;

  constructor(
    private readonly sql: string,
    private readonly tables: Record<string, TableRows>,
    value?: unknown
  ) {
    this.value = value;
  }

  bind(value: unknown) {
    this.value = value;
    return this;
  }

  async all<T>() {
    const tableName = this.extractTableName();
    const rows = tableName ? this.tables[tableName] ?? [] : [];

    if (this.sql.includes('PRAGMA table_info')) {
      const firstRow = rows[0] ?? {};
      return {
        results: Object.keys(firstRow).map((name) => ({ name })) as T[],
      };
    }

    return { results: rows as T[] };
  }

  async first<T>() {
    const tableName = this.extractTableName();
    const rows = tableName ? this.tables[tableName] ?? [] : [];
    const filtered = this.filterRows(rows);
    return (filtered[0] ? this.projectRow(filtered[0]) : null) as T | null;
  }

  private extractTableName(): string | undefined {
    const pragmaMatch = this.sql.match(/PRAGMA table_info\("?([A-Za-z0-9_]+)"?\)/i);
    if (pragmaMatch) return pragmaMatch[1];

    const fromMatch = this.sql.match(/FROM\s+"([A-Za-z0-9_]+)"/i);
    return fromMatch?.[1];
  }

  private filterRows(rows: TableRows): TableRows {
    const whereMatch = this.sql.match(/WHERE\s+"([A-Za-z0-9_]+)"\s*=\s*\?/i);
    if (!whereMatch) return rows;
    const column = whereMatch[1];
    return rows.filter((row) => row[column] === this.value);
  }

  private projectRow(row: Record<string, unknown>) {
    const selectClauseMatch = this.sql.match(/SELECT([\s\S]+?)FROM/i);
    if (!selectClauseMatch) return row;

    const projected: Record<string, unknown> = {};
    const expressions = selectClauseMatch[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    for (const expression of expressions) {
      const quotedAliasMatch = expression.match(/^"([A-Za-z0-9_]+)"\s+AS\s+([A-Za-z0-9_]+)$/i);
      if (quotedAliasMatch) {
        projected[quotedAliasMatch[2]] = row[quotedAliasMatch[1]];
        continue;
      }

      const nullAliasMatch = expression.match(/^NULL\s+AS\s+([A-Za-z0-9_]+)$/i);
      if (nullAliasMatch) {
        projected[nullAliasMatch[1]] = null;
        continue;
      }

      const literalAliasMatch = expression.match(/^([01])\s+AS\s+([A-Za-z0-9_]+)$/i);
      if (literalAliasMatch) {
        projected[literalAliasMatch[2]] = Number(literalAliasMatch[1]);
      }
    }

    return projected;
  }
}

class FakeD1Database {
  constructor(private readonly tables: Record<string, TableRows>) {}

  prepare(sql: string) {
    return new FakePreparedStatement(sql, this.tables);
  }
}

describe('worker user-backed claim resolution', () => {
  it('authenticates an SME owner and derives a startup slug from camelCase SME data', async () => {
    const passwordHash = await bcrypt.hash('OwnerPass123!', 4);
    const db = new FakeD1Database({
      users: [
        {
          id: 'owner-1',
          email: 'owner@example.com',
          password: passwordHash,
          role: 'SME_OWNER',
          isActive: 1,
          isVerified: 1,
        },
      ],
      sme_profiles: [
        {
          id: 'sme-1',
          userId: 'owner-1',
          companyName: 'Health Rocket AI',
        },
      ],
    }) as unknown as D1Database;

    const claims = await authenticateUserBackedClaims({
      db,
      email: 'owner@example.com',
      password: 'OwnerPass123!',
      defaultOrg: 'brainsait-incubator',
    });

    expect(claims).toEqual({
      userId: 'owner-1',
      email: 'owner@example.com',
      role: 'SME_OWNER',
      org: 'brainsait-incubator',
      startupOrg: 'brainsait-incubator',
      startupSlug: 'health-rocket-ai',
      organizations: ['brainsait-incubator'],
    });
  });

  it('resolves a mentor without startup scope', async () => {
    const db = new FakeD1Database({
      users: [
        {
          id: 'mentor-1',
          email: 'mentor@example.com',
          password: 'unused',
          role: 'MENTOR',
          isActive: 1,
          isVerified: 1,
        },
      ],
      sme_profiles: [],
    }) as unknown as D1Database;

    const claims = await resolveUserBackedClaims({
      db,
      userId: 'mentor-1',
      defaultOrg: 'brainsait-incubator',
    });

    expect(claims).toEqual({
      userId: 'mentor-1',
      email: 'mentor@example.com',
      role: 'MENTOR',
      org: 'brainsait-incubator',
      organizations: ['brainsait-incubator'],
    });
  });

  it('resolves an admin from snake_case columns without requiring startup data', async () => {
    const db = new FakeD1Database({
      users: [
        {
          id: 'admin-1',
          email: 'admin@example.com',
          password: 'unused',
          role: 'ADMIN',
          is_active: 1,
          is_verified: 1,
          sme_id: null,
        },
      ],
      sme_profiles: [
        {
          id: 'sme-legacy',
          user_id: 'someone-else',
          company_name: 'Legacy Startup',
        },
      ],
    }) as unknown as D1Database;

    const claims = await resolveUserBackedClaims({
      db,
      email: 'admin@example.com',
      defaultOrg: 'brainsait-incubator',
    });

    expect(claims).toEqual({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      org: 'brainsait-incubator',
      organizations: ['brainsait-incubator'],
    });
  });
});