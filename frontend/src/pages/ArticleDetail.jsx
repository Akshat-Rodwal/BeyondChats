import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../utils/api";

export default function ArticleDetail() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("original");

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/articles/${id}`);
                setArticle(res.data);
            } catch (err) {
                setError(err?.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);

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
                    Error loading article
                </div>
                <div className="text-gray-500 text-sm">{error}</div>
            </div>
        );
    if (!article)
        return (
            <div className="text-center py-12 text-gray-500">
                Article not found
            </div>
        );

    const showUpdated = article.type === "updated";
    return (
        <div className="max-w-4xl mx-auto px-4 pb-12">
            {/* Header Section */}
            <header className="mb-8 border-b border-gray-100 pb-8">
                <div className="flex gap-2 mb-4">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            article.type === "updated"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-indigo-50 text-indigo-700"
                        }`}
                    >
                        {article.type === "updated"
                            ? "Updated Version"
                            : "Original Content"}
                    </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                    {article.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                ></path>
                            </svg>
                        </div>
                        <span className="font-medium text-gray-900">
                            BeyondChats Team
                        </span>
                    </div>
                    <span>•</span>
                    <time dateTime={article.createdAt}>
                        {new Date(article.createdAt).toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }
                        )}
                    </time>
                    <span>•</span>
                    <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                    >
                        View Source
                        <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            ></path>
                        </svg>
                    </a>
                </div>
            </header>

            {/* Sticky Tabs */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-200 mb-8 -mx-4 px-4 pt-2">
                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                    <button
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                            tab === "original"
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => setTab("original")}
                    >
                        Original Article
                    </button>
                    <button
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            tab === "updated"
                                ? "border-emerald-600 text-emerald-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        } ${
                            !showUpdated ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => setTab("updated")}
                        disabled={!showUpdated}
                    >
                        AI Enhanced Version
                        {!showUpdated && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                Unavailable
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div
                className="article-content prose prose-lg prose-indigo max-w-none 
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 
        prose-p:text-gray-600 prose-p:leading-relaxed 
        prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
        prose-img:rounded-xl prose-img:shadow-md
        mb-12"
            >
                {tab === "original" ? (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: article.originalContent,
                        }}
                    />
                ) : (
                    <div
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                )}
            </div>

            {/* References Box */}
            {article.references?.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 md:p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            ></path>
                        </svg>
                        Research References
                    </h3>
                    <ul className="space-y-3">
                        {article.references.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-gray-400 text-sm mt-0.5">
                                    {i + 1}.
                                </span>
                                <a
                                    href={r}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-gray-600 hover:text-indigo-600 text-sm break-all transition-colors"
                                >
                                    {r}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
