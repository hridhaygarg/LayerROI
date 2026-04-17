import { useState } from 'react'

export default function OnboardingPage() {
  const [copied, setCopied] = useState(false)

  const proxyUrl = 'https://api.layeroi.com'

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container py-12">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Get Started with layeroi</h2>
        <p className="text-gray-600 mb-12">Connect your AI agents in 15 minutes. No code changes to your agents needed.</p>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">1</div>
              <h3 className="text-xl font-semibold text-gray-900 ml-3">Update Your API Endpoint</h3>
            </div>
            <p className="text-gray-600 mb-4">Instead of calling OpenAI directly, point your code to layeroi. Change this line:</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
              <div className="mb-2"># Before (direct OpenAI):</div>
              <div className="text-gray-400">const client = new OpenAI(&#123;</div>
              <div className="text-gray-400">&nbsp;&nbsp;apiKey: process.env.OPENAI_API_KEY</div>
              <div className="text-gray-400">&#125;)</div>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="mb-2"># After (through layeroi proxy):</div>
              <div className="text-gray-400">const client = new OpenAI(&#123;</div>
              <div className="text-gray-400">&nbsp;&nbsp;apiKey: process.env.OPENAI_API_KEY,</div>
              <div className="text-green-400 font-bold">&nbsp;&nbsp;baseURL: '{proxyUrl}' <span className="text-gray-400">// ← Add this</span></div>
              <div className="text-gray-400">&#125;)</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-green-600">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white font-bold">2</div>
              <h3 className="text-xl font-semibold text-gray-900 ml-3">Add Agent Identification (Optional)</h3>
            </div>
            <p className="text-gray-600 mb-4">Send your agent's name in the request header so costs are tagged correctly:</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="text-gray-400">const headers = &#123;</div>
              <div className="text-green-400 font-bold">&nbsp;&nbsp;'X-Agent-Name': 'my-pricing-agent'</div>
              <div className="text-gray-400">&#125;</div>
            </div>
            <p className="text-gray-600 mt-4 text-sm">Or add it to the query string: <code className="bg-gray-100 px-2 py-1 rounded">?agent=my-pricing-agent</code></p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-600">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 text-white font-bold">3</div>
              <h3 className="text-xl font-semibold text-gray-900 ml-3">Deploy and Monitor</h3>
            </div>
            <p className="text-gray-600 mb-4">That's it! Now visit the Dashboard tab to watch your costs in real-time:</p>
            <ul className="space-y-2 text-gray-700">
              <li>✓ See costs per agent</li>
              <li>✓ Track API calls and token usage</li>
              <li>✓ Get alerts if an agent goes into a runaway loop</li>
              <li>✓ Optimize your LLM spending</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Your Proxy URL:</h3>
            <div className="flex items-center gap-2">
              <code className="bg-white text-blue-600 px-4 py-2 rounded flex-1 font-mono text-sm border border-blue-300">{proxyUrl}</code>
              <button
                onClick={() => copyToClipboard(proxyUrl)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Troubleshooting</h3>
            <div className="space-y-2 text-gray-700 text-sm">
              <p><strong>Proxy not responding?</strong> Make sure the backend is running</p>
              <p><strong>Costs not showing?</strong> Check that Supabase credentials are set</p>
              <p><strong>Agent name not captured?</strong> Add <code className="bg-gray-300 px-1 rounded">X-Agent-Name</code> header to requests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
