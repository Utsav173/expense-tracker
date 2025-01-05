"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookOpen, Terminal } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { github } from "react-syntax-highlighter/dist/esm/styles/hljs";

const Home = () => {
  const [collection, setCollection] = useState<{
    item: any[];
    info: { name: string; description: string };
  } | null>(null);
  const [activeTab, setActiveTab] = useState("docs");
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const postmanCollection = JSON.parse(text);
      console.log("Loaded collection:", postmanCollection); // Debug log
      setCollection(postmanCollection);
      setError(null);
    } catch (error) {
      console.error("Error processing file:", error);
      setError(
        "Failed to parse the Postman collection. Please ensure it's a valid JSON file."
      );
    }
  };

  const processEndpoints = (items: any[]) => {
    let endpoints: any[] = [];

    items.forEach((item: { request: any; item: any }) => {
      if (item.request) {
        // This is an endpoint
        endpoints.push(item);
      } else if (item.item && Array.isArray(item.item)) {
        // This is a folder
        endpoints = [...endpoints, ...processEndpoints(item.item)];
      }
    });

    return endpoints;
  };

  const generateNodeSDK = (collection: {
    item: any;
    info: { name: string; description: string };
  }) => {
    if (!collection?.item) return "";

    const endpoints = processEndpoints(collection.item);
    const className =
      collection.info?.name?.replace(/[^a-zA-Z0-9]/g, "") || "APIClient";

    const code = [];
    code.push(`const axios = require('axios');

class ${className} {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api.example.com';
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': \`Bearer \${this.apiKey}\` })
      }
    });
  }

  async handleRequest(method, path, options = {}) {
    try {
      const response = await this.client({
        method,
        url: path,
        ...options
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(\`API Error: \${error.response.status} - \${JSON.stringify(error.response.data)}\`);
      }
      throw error;
    }
  }\n`);

    endpoints.forEach((endpoint) => {
      const methodName = endpoint.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "_");
      const method = endpoint.request.method?.toLowerCase() || "get";
      const path =
        endpoint.request.url?.raw ||
        endpoint.request.url?.path ||
        endpoint.request.url;

      code.push(`  /**
   * ${endpoint.name}
   * ${endpoint.request.description || ""}
   */`);

      if (method === "get") {
        code.push(`  async ${methodName}(params = {}) {
    return this.handleRequest('${method}', '${path}', { params });
  }\n`);
      } else {
        code.push(`  async ${methodName}(data = {}) {
    return this.handleRequest('${method}', '${path}', { data });
  }\n`);
      }
    });

    code.push(`}

module.exports = ${className};`);

    return code.join("\n");
  };

  const renderEndpoint = (endpoint: {
    name: string;
    request: any;
    response: any;
    description: string;
  }) => {
    const method = endpoint.request?.method || "GET";
    const url =
      endpoint.request?.url?.raw ||
      endpoint.request?.url?.path ||
      endpoint.request?.url;
    const headers = endpoint.request?.header || [];
    const body = endpoint.request?.body?.raw;
    const responses = endpoint.response || [];

    return (
      <Card key={endpoint?.name as string} className="overflow-hidden mb-6">
        <CardHeader className="bg-gray-50 p-6">
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium 
              ${method === "GET" ? "bg-blue-100 text-blue-700" : ""}
              ${method === "POST" ? "bg-green-100 text-green-700" : ""}
              ${method === "PUT" ? "bg-yellow-100 text-yellow-700" : ""}
              ${method === "DELETE" ? "bg-red-100 text-red-700" : ""}
            `}
            >
              {method}
            </span>
            <code className="text-gray-800">{url}</code>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">{endpoint.name}</h3>
          <p className="text-gray-600 mb-6">{endpoint.description}</p>

          {headers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                HEADERS
              </h4>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                {headers
                  .map(
                    (header: { key: any; value: any }) =>
                      `${header.key}: ${header.value}`
                  )
                  .join("\n")}
              </pre>
            </div>
          )}

          {body && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                REQUEST BODY
              </h4>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                <code>{JSON.stringify(JSON.parse(body), null, 2)}</code>
              </pre>
            </div>
          )}

          {responses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                RESPONSE EXAMPLE
              </h4>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                <code>
                  {responses[0].body
                    ? JSON.stringify(JSON.parse(responses[0].body), null, 2)
                    : "No response example available"}
                </code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDocumentation = () => {
    if (!collection) return null;

    const endpoints = processEndpoints(collection.item || []);

    return (
      <div className="space-y-8">
        {/* API Overview */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {collection.info?.name || "API Documentation"}
          </h1>
          <p className="text-gray-600 text-lg">
            {collection.info?.description || "No description available"}
          </p>
        </div>

        {/* Authentication */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                Authentication is handled using Bearer tokens passed in the
                Authorization header.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <code>Authorization: Bearer your_api_key</code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Endpoints */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">API Endpoints</h2>
          {endpoints.map((endpoint) => renderEndpoint(endpoint))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold">
                API Documentation Generator
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        </div>
      )}

      {/* Main Content */}
      {collection && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === "docs"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600"
              }`}
            >
              <FileText className="w-4 h-4" />
              Documentation
            </button>
            <button
              onClick={() => setActiveTab("sdk")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === "sdk"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600"
              }`}
            >
              <Terminal className="w-4 h-4" />
              Node.js SDK
            </button>
          </div>

          {activeTab === "docs" && renderDocumentation()}

          {activeTab === "sdk" && (
            <Card>
              <CardHeader>
                <CardTitle>Node.js SDK</CardTitle>
              </CardHeader>
              <CardContent>
                <SyntaxHighlighter
                  language="javascript"
                  style={github}
                  customStyle={{
                    borderRadius: "0.5rem",
                    padding: "1.5rem",
                  }}
                >
                  {generateNodeSDK(collection)}
                </SyntaxHighlighter>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
