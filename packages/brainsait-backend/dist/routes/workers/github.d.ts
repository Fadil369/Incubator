/**
 * Workers-compatible GitHub proxy & automation routes.
 *
 * Proxies GitHub REST API calls so the PAT never has to leave the Worker,
 * and provides automation endpoints (create repo from template, dispatch
 * workflow, install GitHub App) consumed by the Incubator startup portals.
 */
declare const github: any;
export default github;
//# sourceMappingURL=github.d.ts.map