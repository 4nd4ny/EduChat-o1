import OpenAIProvider from "../context/OpenAIProvider";
import type { AppProps } from "next/app";
import Layout from '../context/Layout'; 

import "@/utils/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
        <OpenAIProvider>
          <Layout>   
            <Component {...pageProps} />
          </Layout>   
        </OpenAIProvider>
    </>
  );
}
