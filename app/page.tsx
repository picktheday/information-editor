import InformationEditor from "@/components/information-editor"

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center p-2">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4">Information Editor</h1>
        <InformationEditor />
      </div>
    </main>
  )
}

