"use client";
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useGetTeamsQuery, useGetPlayersByTeamQuery, useCreateProgramMutation } from '@/features/trainingSessionViewer/trainingSessionApi';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Define the type for the grid cells (string in this case)
type GridCell = string;
type GridState = GridCell[][];

export default function CreateProgramPage() {
  // Fetch teams and players
  const { data: teams = [], isLoading: teamsLoading } = useGetTeamsQuery();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const { data: players = [], isLoading: playersLoading } = useGetPlayersByTeamQuery(selectedTeam, { skip: !selectedTeam });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Place and Trainer state
  const [place, setPlace] = useState('');
  const [trainer, setTrainer] = useState('');

  // Grid state and handlers - ADDED MISSING DEFINITIONS HERE
  const [grid, setGrid] = useState<GridState>([
    ['Kolumn 1'], // Initial header row
    [''],         // Initial data row
  ]);

  const handleCellChange = (r: number, c: number, value: string) => {
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = value;
    setGrid(newGrid);
  };

  const addRow = () => {
    setGrid(prevGrid => [
      ...prevGrid,
      Array(prevGrid[0]?.length || 1).fill('') // New row with same number of columns as header
    ]);
  };

  const removeRow = (rowIndex: number) => {
    // Prevent deleting the header row or if only one data row exists
    if (rowIndex === 0 || grid.length <= 2) return;
    setGrid(prevGrid => prevGrid.filter((_, index) => index !== rowIndex));
  };

  const addCol = () => {
    setGrid(prevGrid =>
      prevGrid.map((row, index) => [
        ...row,
        index === 0 ? `Kolumn ${row.length + 1}` : '' // Add header or empty cell
      ])
    );
  };

  const removeCol = (colIndex: number) => {
    // Prevent deleting the last column
    if (grid[0]?.length <= 1) return;
    setGrid(prevGrid =>
      prevGrid.map(row => row.filter((_, index) => index !== colIndex))
    );
  };
  // END OF ADDED DEFINITIONS

  const selectAll = () => setSelectedPlayers(players.map(p => p.id));
  const deselectAll = () => setSelectedPlayers([]);
  const togglePlayer = (id: string) => setSelectedPlayers(prev =>
    prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
  );

  // Schedule entries state and handlers for multiple dates
  const [schedules, setSchedules] = useState<{ date: string; startTime: string; endTime: string }[]>([
    { date: '', startTime: '', endTime: '' }
  ]);
  const addSchedule = () => {
    setSchedules(prev => [...prev, { date: '', startTime: '', endTime: '' }]);
  };
  const removeSchedule = (index: number) => {
    if (schedules.length <= 1) return;
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };
  const updateSchedule = (index: number, field: 'date' | 'startTime' | 'endTime', value: string) => {
    setSchedules(prev => prev.map((sch, i) => i === index ? { ...sch, [field]: value } : sch));
  };

  // RTK Query mutation hook for creating a program
  const [createProgram, { isLoading: isSaving, isSuccess, isError }] = useCreateProgramMutation();

  const handleSave = async () => {
    try {
      await createProgram({
        teamId: selectedTeam,
        players: selectedPlayers,
        schedules: schedules.map(s => ({ date: s.date, time: `${s.startTime}-${s.endTime}` })),
        category: '', // TODO: set the correct category if needed
        headers: grid[0],
        place,
        trainer,
        grid,
      }).unwrap();
      // TODO: Show success feedback or redirect
    } catch (err: unknown) {
      const error = err as FetchBaseQueryError;
      if (error.status) {
        console.error('API error saving program:', error.status, error.data);
      } else {
        console.error('Unexpected error saving program:', err);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Skapa Fysträningsprogram</h1>

      <form onSubmit={async (e) => { e.preventDefault(); await handleSave(); }} className="space-y-6">
        {/* Main Selection Layout: Left inputs and Right players list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6 md:col-span-1">
            <div className="space-y-2">
              <Label htmlFor="team-select">Lag</Label>
              <select
                id="team-select"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                disabled={teamsLoading}
                className="w-full rounded-md border px-2 py-1 text-sm"
              >
                <option value="">Välj lag...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Schedule list for multiple dates */}
            <div className="space-y-4">
              <Label className="block text-lg font-semibold">Schema</Label>
              {schedules.map((sch, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <Label htmlFor={`schedule-date-${i}`}>Datum</Label>
                    <Input id={`schedule-date-${i}`} type="date" value={sch.date} onChange={e => updateSchedule(i, 'date', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`schedule-start-${i}`}>Starttid</Label>
                    <Input id={`schedule-start-${i}`} type="time" value={sch.startTime} onChange={e => updateSchedule(i, 'startTime', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`schedule-end-${i}`}>Sluttid</Label>
                    <Input id={`schedule-end-${i}`} type="time" value={sch.endTime} onChange={e => updateSchedule(i, 'endTime', e.target.value)} />
                  </div>
                  {schedules.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSchedule(i)} title="Ta bort datum">
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSchedule} className="mt-2">
                <Plus size={16} className="mr-1 inline" />Lägg till datum
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="place">Plats</Label>
              <Input id="place" placeholder="Ange plats..." value={place} onChange={e => setPlace(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainer">Tränare</Label>
              <Input id="trainer" placeholder="Ange tränare..." value={trainer} onChange={e => setTrainer(e.target.value)} />
            </div>
          </div>

          {/* Right Column: Players List */}
          <div className="space-y-2 md:col-span-2">
            <Label>Spelare</Label>
            <div className="flex space-x-2 mb-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={!selectedTeam || playersLoading || !players.length}>Markera alla</Button>
              <Button type="button" variant="outline" size="sm" onClick={deselectAll} disabled={!selectedPlayers.length}>Avmarkera alla</Button>
            </div>
            <div className="space-y-1 h-[600px] overflow-auto border rounded p-2 bg-background" aria-disabled={!selectedTeam || playersLoading}>
              {playersLoading && selectedTeam && <p className="text-muted-foreground text-sm">Laddar spelare...</p>}
              {!playersLoading && !players.length && selectedTeam && <p className="text-muted-foreground text-sm">Inga spelare hittades för valt lag.</p>}
              {!selectedTeam && <p className="text-muted-foreground text-sm">Välj ett lag för att se spelare.</p>}
              {players.map((player) => (
                <div key={player.id} className="flex items-center space-x-2">
                  <input
                    id={`player-${player.id}`} type="checkbox" checked={selectedPlayers.includes(player.id)} onChange={() => togglePlayer(player.id)} disabled={!selectedTeam || playersLoading} className="rounded" />
                  <label htmlFor={`player-${player.id}`} className="flex-1 truncate text-sm">{player.name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editable Grid */}
        <div>
           <Label className="text-lg font-semibold mb-2 block">Programsplan</Label>
          <div className="mb-6 overflow-auto border rounded">
            <div className="flex space-x-2 p-2 border-b">
              <Button type="button" variant="outline" size="icon" onClick={addCol} title="Lägg till kolumn"><Plus size={16} /></Button>
              <Button type="button" variant="outline" size="icon" onClick={addRow} title="Lägg till rad"><Plus size={16} /></Button>
            </div>
            <table className="table-fixed border-collapse w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  {/* Render header row */}
                  {grid[0]?.map((header, c) => (
                    <th key={c} className="border p-2 font-semibold">
                      <div className="flex items-center justify-between gap-1">
                        <Input
                          type="text"
                          value={header}
                          onChange={e => handleCellChange(0, c, e.target.value)}
                          className="h-8 text-xs sm:text-sm flex-grow min-w-[80px]" // Adjusted width
                          placeholder={`Kolumn ${c + 1}`}
                        />
                        {grid[0]?.length > 1 && ( // Show remove button only if more than one column exists
                           <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeCol(c)} title="Ta bort kolumn">
                            <Trash2 size={14} />
                           </Button>
                        )}
                      </div>
                    </th>
                  ))}
                   {/* Empty cell for row remove button alignment */}
                  <th className="border p-2 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                 {/* Render data rows */}
                {grid.slice(1).map((row, r) => (
                  <tr key={r + 1}>
                    {row.map((cell, c) => (
                      <td key={c} className="border p-1">
                        <Input
                          type="text"
                          value={cell}
                          onChange={e => handleCellChange(r + 1, c, e.target.value)}
                           className="h-8 text-xs sm:text-sm min-w-[80px]" // Adjusted width and height
                           placeholder="Ange värde..."
                        />
                      </td>
                    ))}
                     {/* Row remove button */}
                    <td className="border p-1 text-center align-middle">
                     {grid.length > 2 && ( // Show remove button only if more than one data row exists
                       <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeRow(r + 1)} title="Ta bort rad">
                         <Trash2 size={14} />
                       </Button>
                     )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end items-center space-x-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Sparar...' : 'Spara Program'}
          </Button>
          {isError && <p className="text-destructive text-sm">Ett fel uppstod vid sparandet.</p>}
        </div>
      </form>
    </div>
  );
}