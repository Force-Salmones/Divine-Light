
export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    if (!cookieHeader) return out;
    const parts = cookieHeader.split(";");
    for (const p of parts) {
        const [k, ...rest] = p.trim().split("=");
        if (!k) continue;
        out[k] = decodeURIComponent(rest.join("="));
    }
    return out;
}
