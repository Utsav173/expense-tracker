# Expense Tracker API Documentation Generator

This project is a Next.js application that automatically generates API documentation from a Postman collection. It allows you to:

1.  **Upload a Postman Collection:**  Upload a `.json` file containing your Postman collection.
2.  **View Documentation:**  Generate and view well-formatted API documentation, including endpoints, request/response examples, headers, and descriptions.
3.  **Generate Node.js SDK:**  Create a basic Node.js SDK client based on the Postman collection, allowing you to easily interact with your API from Node.js applications.
4.  **Dynamic API Docs:** Automatically fetch API data from Postman Collection which present on a different github branch.

## Technologies Used

*   **Next.js:**  A React framework for building web applications.
*   **React:**  A JavaScript library for building user interfaces.
*   **Tailwind CSS:**  A utility-first CSS framework for rapidly building custom designs.
*   **Shadcn UI:** A collection of reusable components, built on top of Radix UI and Tailwind CSS.
*   **`react-syntax-highlighter`:**  For code highlighting.
*   **`lucide-react`:** For icons.
*   **`class-variance-authority`:** For managing CSS class variations.
*   **`clsx` and `tailwind-merge`:** For efficiently merging Tailwind CSS classes.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Utsav173/expense-tracker.git
    cd expense-tracker/api-docs
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Run the development server:**

    ```bash
    bun dev
    ```

    This will start the Next.js development server, typically on `http://localhost:3000`.

4.  **Open in your browser:**
    Visit `http://localhost:3000` in your web browser.

## Usage

1.  **Obtain your Postman Collection:**
    *   In Postman, export your collection as a `Collection v2.1` JSON file.
2.  **Upload the Collection:**
    *   On the documentation generator page, click the "Choose File" button.
    *   Select the exported `.json` file from your computer.
3.  **View Documentation:**
    *   The documentation will be automatically generated and displayed.
4.  **Generate Node.js SDK:**
    *   Click the "Node.js SDK" tab.
    *   The generated SDK code will be displayed. You can copy and paste this into your Node.js project.

## Project Structure

*   **`src/app/`:**  Contains the main application logic, including the page layout (`layout.tsx`) and the main page (`page.tsx`).
*   **`src/components/`:** Reusable React components.
    *   **`ui/`:**  UI components from Shadcn UI (Card, Button, etc.).
*   **`src/lib/`:** Utility functions.
    *   **`utils.ts`:**  Contains the `cn` function for combining CSS classes.
*   **`tailwind.config.ts`:**  Tailwind CSS configuration file.
*   **`postcss.config.js`:**  PostCSS configuration file.
*   **`tsconfig.json`:** TypeScript configuration file.

## Configuration

*   **Tailwind CSS:**  The Tailwind CSS configuration is located in `tailwind.config.ts`.  You can customize the theme, add plugins, etc.
*   **Shadcn UI:**  The Shadcn UI configuration is in `components.json`. You can adjust the style, theme, and component aliases.
*  **`API_BASE_URL`:** This variable need to be changed in `page.tsx` file.

## Dependencies

The project uses several key dependencies.  You can find the complete list in `package.json`.  Some of the most important ones are:

*   `next`: The Next.js framework.
*   `react`, `react-dom`:  React and its DOM-related utilities.
*   `class-variance-authority`, `clsx`, `tailwind-merge`:  Utilities for managing CSS classes.
*   `lucide-react`:  Icon library.
*   `react-syntax-highlighter`: For displaying code snippets.
*   `@types/node`, `@types/react`, `@types/react-dom`, `typescript`:  TypeScript-related dependencies.
*   `postcss`, `tailwindcss`:  For styling.
*   `tailwindcss-animate`: For Tailwind CSS animations.

## Deployment

This project is a standard Next.js application and can be deployed to various platforms, such as Vercel, Netlify, or AWS Amplify.  See the Next.js documentation for deployment instructions.

## Contributing

*Explain how to contribute.  Include information about:*

*   Creating issues.
*   Submitting pull requests.
*   Coding style.

## License

*Specify the license under which your project is released (e.g., MIT, Apache 2.0, etc.).*
