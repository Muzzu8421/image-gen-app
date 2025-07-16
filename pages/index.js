import Head from "next/head";
import ImageGenApp from "@/components/ImageGenApp";

export default function Home() {
  return (
    <>
      <Head>
        <title>Image Generator</title>
      </Head>
      <main className="min-h-screen p-4 bg-gray-100">
        <ImageGenApp />
      </main>
    </>
  );
}
