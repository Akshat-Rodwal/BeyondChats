import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import ArticleList from './pages/ArticleList'
import ArticleDetail from './pages/ArticleDetail'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-indigo-700 transition-colors">
                B
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                BeyondChats<span className="text-gray-400 font-normal">Blog</span>
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Articles
              </Link>
              <a 
                href="https://beyondchats.com/blogs/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-sm font-medium px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all hover:shadow-md"
              >
                Visit Main Site
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <Routes>
            <Route path="/" element={<ArticleList />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
          </Routes>
        </main>

        <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">BeyondChats</span>
                        <span className="text-gray-400">© {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Twitter</a>
                    </div>
                </div>
            </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
