import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownPreviewProps {
  content: string;
  onDownload?: () => void;
}

export function MarkdownPreview({ content, onDownload }: MarkdownPreviewProps) {
  const components = useMemo(
    () => ({
      // Code blocks with syntax highlighting
      code({
        inline,
        className,
        children,
        ...props
      }: {
        inline?: boolean;
        className?: string;
        children?: React.ReactNode;
      } & React.HTMLAttributes<HTMLElement>) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';

        if (!inline && language) {
          return (
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="rounded-md !bg-background !my-4"
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          );
        }

        if (!inline) {
          return (
            <SyntaxHighlighter
              style={oneDark}
              language="text"
              PreTag="div"
              className="rounded-md !bg-background !my-4"
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          );
        }

        return (
          <code
            className="rounded bg-background px-1.5 py-0.5 font-mono text-sm text-accent"
            {...props}
          >
            {children}
          </code>
        );
      },
      // Links open in new tab
      a({
        href,
        children,
        ...props
      }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
            {...props}
          >
            {children}
          </a>
        );
      },
      // Tables
      table({
        children,
        ...props
      }: React.TableHTMLAttributes<HTMLTableElement>) {
        return (
          <div className="my-4 overflow-x-auto">
            <table
              className="min-w-full divide-y divide-border border border-border"
              {...props}
            >
              {children}
            </table>
          </div>
        );
      },
      thead({
        children,
        ...props
      }: React.HTMLAttributes<HTMLTableSectionElement>) {
        return (
          <thead className="bg-surface" {...props}>
            {children}
          </thead>
        );
      },
      th({
        children,
        ...props
      }: React.ThHTMLAttributes<HTMLTableCellElement>) {
        return (
          <th
            className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary"
            {...props}
          >
            {children}
          </th>
        );
      },
      td({
        children,
        ...props
      }: React.TdHTMLAttributes<HTMLTableCellElement>) {
        return (
          <td
            className="whitespace-nowrap border-t border-border px-4 py-2 text-sm text-text-primary"
            {...props}
          >
            {children}
          </td>
        );
      },
      // Headings
      h1({
        children,
        ...props
      }: React.HTMLAttributes<HTMLHeadingElement>) {
        return (
          <h1
            className="mb-4 mt-6 border-b border-border pb-2 text-2xl font-bold text-text-primary first:mt-0"
            {...props}
          >
            {children}
          </h1>
        );
      },
      h2({
        children,
        ...props
      }: React.HTMLAttributes<HTMLHeadingElement>) {
        return (
          <h2
            className="mb-3 mt-5 border-b border-border pb-1.5 text-xl font-semibold text-text-primary first:mt-0"
            {...props}
          >
            {children}
          </h2>
        );
      },
      h3({
        children,
        ...props
      }: React.HTMLAttributes<HTMLHeadingElement>) {
        return (
          <h3
            className="mb-2 mt-4 text-lg font-semibold text-text-primary first:mt-0"
            {...props}
          >
            {children}
          </h3>
        );
      },
      h4({
        children,
        ...props
      }: React.HTMLAttributes<HTMLHeadingElement>) {
        return (
          <h4
            className="mb-2 mt-3 text-base font-semibold text-text-primary first:mt-0"
            {...props}
          >
            {children}
          </h4>
        );
      },
      // Paragraphs
      p({
        children,
        ...props
      }: React.HTMLAttributes<HTMLParagraphElement>) {
        return (
          <p className="my-3 leading-relaxed text-text-primary" {...props}>
            {children}
          </p>
        );
      },
      // Lists
      ul({
        children,
        ...props
      }: React.HTMLAttributes<HTMLUListElement>) {
        return (
          <ul className="my-3 list-disc pl-6 text-text-primary" {...props}>
            {children}
          </ul>
        );
      },
      ol({
        children,
        ...props
      }: React.OlHTMLAttributes<HTMLOListElement>) {
        return (
          <ol className="my-3 list-decimal pl-6 text-text-primary" {...props}>
            {children}
          </ol>
        );
      },
      li({
        children,
        ...props
      }: React.LiHTMLAttributes<HTMLLIElement>) {
        return (
          <li className="my-1" {...props}>
            {children}
          </li>
        );
      },
      // Blockquotes
      blockquote({
        children,
        ...props
      }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
        return (
          <blockquote
            className="my-4 border-l-4 border-accent pl-4 italic text-text-secondary"
            {...props}
          >
            {children}
          </blockquote>
        );
      },
      // Horizontal rules
      hr({ ...props }: React.HTMLAttributes<HTMLHRElement>) {
        return <hr className="my-6 border-border" {...props} />;
      },
      // Images
      img({
        src,
        alt,
        ...props
      }: React.ImgHTMLAttributes<HTMLImageElement>) {
        return (
          <img
            src={src}
            alt={alt}
            className="my-4 max-w-full rounded-md"
            {...props}
          />
        );
      },
    }),
    []
  );

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      {onDownload && (
        <div className="flex items-center justify-end border-b border-border bg-surface px-3 py-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/80"
          >
            <DownloadIcon className="h-4 w-4" />
            Download
          </button>
        </div>
      )}

      {/* Markdown content */}
      <div className="flex-1 overflow-auto p-6">
        <article className="prose prose-invert mx-auto max-w-4xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export default MarkdownPreview;
