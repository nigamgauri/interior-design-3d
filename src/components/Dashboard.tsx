import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Image as ImageIcon, Loader2, Play, ChevronLeft, Box, Building2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeViewer } from './ThreeViewer';
import { ElevationViewer } from './ElevationViewer';
import { processFloorPlan } from '../lib/neuralEngine';
import { MOCK_ARCHITECTURE } from '../lib/mockArchitecture';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'elevation'>('3d');
  const [savingFurniture, setSavingFurniture] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching projects:', error);
    else setProjects(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Use a pure timestamp + clean extension to avoid ANY special character issues
      const extension = file.name.split('.').pop() || 'png';
      const fileName = `${user.id}/${Date.now()}.${extension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(fileName);

      const { error: dbError, data: projectData } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          name: file.name.split('.')[0],
          image_url: publicUrl,
          status: 'processing'
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      
      fetchProjects();

      try {
        console.log('Starting client-side AI processing...');
        const processedData = await processFloorPlan(publicUrl);

        await supabase
          .from('projects')
          .update({ processed_data: processedData, status: 'completed' })
          .eq('id', projectData.id);
        
        console.log('AI processing successful.');
        fetchProjects();
      } catch (aiError: any) {
        console.error('AI Processing Error in Dashboard:', aiError);
        await supabase
          .from('projects')
          .update({ 
            status: 'failed',
            processed_data: { error: aiError.message || 'AI processing failed' } 
          })
          .eq('id', projectData.id);
        
        fetchProjects();
      }
    } catch (error: any) {
      console.error('Error uploading floor plan:', error);
      alert(`Failed to upload floor plan: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const runSimulation = async (projectId: string) => {
    setUploading(true);
    try {
      await supabase
        .from('projects')
        .update({ 
          processed_data: MOCK_ARCHITECTURE, 
          status: 'completed' 
        })
        .eq('id', projectId);
      
      console.log('Simulation applied successfully.');
      await fetchProjects();
      // Re-select the project with new data
      const { data: updated } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (updated) setSelectedProject(updated);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFurnitureChange = useCallback(async (furniture: any[]) => {
    if (!selectedProject) return;
    setSavingFurniture(true);
    try {
      const updatedData = { ...selectedProject.processed_data, furniture };
      await supabase
        .from('projects')
        .update({ processed_data: updatedData })
        .eq('id', selectedProject.id);
      setSelectedProject((prev: any) => ({ ...prev, processed_data: updatedData }));
    } catch (err) {
      console.error('Failed to save furniture:', err);
    } finally {
      setTimeout(() => setSavingFurniture(false), 1000);
    }
  }, [selectedProject]);

  if (selectedProject) {
    return (
      <div className="pt-20 h-screen flex flex-col bg-brand-bg">
        <div className="px-8 py-6 flex items-center justify-between glass-card border-b border-white/5 relative z-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSelectedProject(null)}
              className="p-3 bg-white/5 hover:bg-brand-primary/10 hover:text-brand-primary rounded-2xl transition-all border border-white/5 group"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-1 block">Active Project</span>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">{selectedProject.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            {selectedProject.status === 'completed' && (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('3d')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                    viewMode === '3d' ? 'bg-brand-primary text-[#0b0e14]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3 h-3" /> 3D Plan
                </button>
                <button
                  onClick={() => setViewMode('elevation')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                    viewMode === 'elevation' ? 'bg-brand-primary text-[#0b0e14]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3 h-3" /> Elevation
                </button>
              </div>
            )}
            {/* Furniture Save Status */}
            {savingFurniture && (
              <div className="flex items-center gap-1.5 text-[10px] text-brand-primary font-bold uppercase tracking-wider">
                <Save className="w-3 h-3 animate-bounce" /> Saving Layout...
              </div>
            )}
            {/* Status badge */}
            <div className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                selectedProject.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                selectedProject.status === 'processing' ? 'bg-brand-primary/10 text-brand-primary animate-pulse' :
                'bg-red-500/10 text-red-400'
              }`}>
              <div className={`w-2 h-2 rounded-full ${
                selectedProject.status === 'completed' ? 'bg-green-400' :
                selectedProject.status === 'processing' ? 'bg-brand-primary' :
                'bg-red-400'
              }`} />
              {selectedProject.status}
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden bg-[#0b0e14]">
          {selectedProject.status === 'completed' && selectedProject.processed_data ? (
            viewMode === 'elevation' ? (
              <ElevationViewer
                walls={selectedProject.processed_data.walls || []}
                rooms={selectedProject.processed_data.rooms || []}
              />
            ) : (
            <ThreeViewer
              data={selectedProject.processed_data}
              onFurnitureChange={handleFurnitureChange}
            />
            )
          ) : selectedProject.status === 'failed' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <ImageIcon className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight uppercase italic">Neural Link Denied</h3>
              <p className="text-red-400 font-body mb-8 text-center max-w-md">
                {selectedProject.processed_data?.error || 'The Neural Engine encountered a critical error during reconstruction.'}
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={() => runSimulation(selectedProject.id)}
                  className="btn-primary w-full bg-brand-primary text-brand-bg hover:bg-white flex items-center justify-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  Run Neural Simulation
                </button>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="px-6 py-3 rounded-2xl bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/5"
                >
                  Return to Archive
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-2 border-brand-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-b-2 border-brand-primary rounded-full animate-spin" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight uppercase italic">Neural Processing...</h3>
              <p className="text-gray-500 font-body mb-8">The Neural Engine is extracting architectural dimensions</p>
              
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-brand-primary to-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tighter uppercase italic">The Neural Archive</h2>
          <p className="text-gray-500 font-body">Manage and view your 3D neural reconstructions</p>
        </div>
        
        <label className="cursor-pointer btn-primary group">
          <div className="flex items-center gap-2">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
            <span>Reconstruct New Architecture</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group glass-card rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-2xl"
              >
                <div 
                  className="aspect-video relative overflow-hidden bg-brand-bg cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-12 h-12 text-gray-800" />
                    </div>
                  )}
                  
                  {/* Subtle scanline effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-brand-primary/90 rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/50 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <Play className="w-6 h-6 text-brand-bg fill-brand-bg" />
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-1">Architecture</span>
                      <h3 className="font-display font-bold text-xl text-white truncate max-w-[180px]">{project.name}</h3>
                      {project.status === 'failed' && project.processed_data?.error && (
                        <p className="text-[10px] text-red-500 font-bold uppercase mt-1 truncate max-w-[200px]">
                          Error: {project.processed_data.error}
                        </p>
                      )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      project.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      project.status === 'processing' ? 'bg-brand-primary/10 text-brand-primary animate-pulse' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {project.status}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold dark:text-white">No projects yet</h3>
              <p className="text-gray-500">Upload your first floor plan image to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
