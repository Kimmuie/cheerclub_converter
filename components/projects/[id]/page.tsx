import EditorShell from "@/components/editor/EditorShell";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  return <EditorShell projectId={id} />;
}