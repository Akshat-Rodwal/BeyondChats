import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function ArticleList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const res = await api.get("/api/articles?limit=100");
                setItems(res.data.items || []);
            } catch (err) {
                setError(err?.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    if (error)
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-2">
                    Error loading articles
                </div>
                <div className="text-gray-500 text-sm">{error}</div>
            </div>
        );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Latest Articles
                </h2>
                <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    {items.length} posts
                </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                    <Link
                        to={`/articles/${a._id}`}
                        key={a._id}
                        className="group flex flex-col bg-white border border-gray-100 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-indigo-100 hover:-translate-y-0.5 h-full"
                    >
                        <div className="flex flex-col gap-3 flex-grow">
                            <div className="flex items-start justify-between gap-4">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                    {a.title}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                                        a.type === "updated"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-indigo-50 text-indigo-700"
                                    }`}
                                >
                                    {a.type}
                                </span>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                                {(a.content || "")
                                    .replace(/<[^>]*>/g, "")
                                    .slice(0, 150)}
                                ...
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium">
                            <span>
                                {new Date(a.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    }
                                )}
                            </span>
                            <span>•</span>
                            <span>
                                {Math.ceil((a.content || "").length / 1000)} min
                                read
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
