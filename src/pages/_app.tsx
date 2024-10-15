import OpenAIProvider from "../context/OpenAIProvider";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Layout from '../context/Layout'; 

import "@/utils/globals.css";
import 'katex/dist/katex.min.css'; // [REMOVE] A double avec AssistanMessageContent

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
        <OpenAIProvider>
          <Layout>   
            <Component {...pageProps} />
          </Layout>   
        </OpenAIProvider>
      <Analytics />
    </>
  );
}
