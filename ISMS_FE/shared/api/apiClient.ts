export async function apiFetch<T>(
url: string,
options: RequestInit = {}
): Promise<T> {
const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;

const headers: HeadersInit = {
"Content-Type": "application/json",
...(token ? { Authorization: `Bearer ${token}` } : {}),
...options.headers,
};

const res = await fetch(url, {
...options,
headers,
cache: "no-store",
});

// Auto logout nếu token hết hạn
if (res.status === 401) {
if (typeof window !== "undefined") {
localStorage.removeItem("token");
localStorage.removeItem("user");
window.location.href = "/login?reason=expired";
}
throw new Error("Unauthorized");
}

const json = await res.json();

if (!res.ok) {
throw new Error(json.message || "API Error");
}

return json;
}
