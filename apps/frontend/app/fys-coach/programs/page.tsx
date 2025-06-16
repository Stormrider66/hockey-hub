'use client';
import { useGetProgramsQuery } from '@/store/api/trainingApi';
import type { Program } from '@/types/program';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const ProgramsPage = () => {
  const { data: programs, isLoading, isError } = useGetProgramsQuery();
  const router = useRouter();

  if (isLoading) {
    return <p>Loading programs…</p>;
  }

  if (isError) {
    return <p>Error loading programs.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Programs</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={() => router.push('/fys-coach/programs/create')}>Skapa program</Button>
        <Button variant="outline" onClick={() => router.push('/fys-coach/programs/archive')}>Arkiv</Button>
        <Button variant="secondary" onClick={() => router.push('/fys-coach/exercises')}>Exercise Library</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {programs?.map((program: Program) => (
          <div key={program.id} className="p-4 border rounded">
            <h2 className="text-lg font-semibold">{program.name}</h2>
            <p className="text-sm uppercase text-gray-600">{program.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgramsPage; 