import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { CheckSquare } from 'lucide-react'
import useStore from '../store'
import { getGoalProgress } from '../utils/calculations'

const COLUMNS = [
  { id: 'ideas', label: 'Ideas', color: '#6366f1', desc: 'Future goals & brain dumps' },
  { id: 'planned', label: 'Planned', color: '#f59e0b', desc: 'Ready to start soon' },
  { id: 'in_progress', label: 'In Progress', color: '#10b981', desc: 'Currently working on' },
  { id: 'completed', label: 'Completed', color: '#8b5cf6', desc: 'Finished objectives' },
]

export default function Planning() {
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)
  const goalOrder = useStore((s) => s.goalOrder)
  const moveGoalItem = useStore((s) => s.moveGoalItem)
  const reorderGoalSection = useStore((s) => s.reorderGoalSection)

  const onDragEnd = ({ draggableId, source, destination }) => {
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    
    if (source.droppableId === destination.droppableId) {
      reorderGoalSection(source.droppableId, source.index, destination.index)
    } else {
      moveGoalItem(draggableId, source.droppableId, destination.droppableId, destination.index)
    }
  }

  const getGoal = (id) => goals.find((g) => g.id === id)

  return (
    <div className="p-4 md:p-8 h-full flex flex-col pb-24 md:pb-8">
      <div className="flex justify-between items-end mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Planning Board</h1>
          <p className="text-[#555] mt-1 text-sm font-medium">Organize and transition your goals</p>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-hidden overflow-y-auto md:overflow-x-auto md:overflow-y-hidden pb-4 scrollbar-hide">
          <div className="flex flex-col md:flex-row gap-4 h-auto md:h-full md:grid md:grid-cols-4 items-stretch md:items-start min-w-0 md:min-w-fit">
            {COLUMNS.map((col) => {
              const colIds = goalOrder[col.id] || []
              return (
                <div key={col.id} className="bg-[#0e0e0e] border border-[#1E1E1E] rounded-2xl flex flex-col w-full md:w-auto min-h-[250px] md:h-full max-h-full" style={{ borderTop: `2px solid ${col.color}` }}>
                  <div className="px-4 py-3 flex-shrink-0 border-b border-[#1A1A1A]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white tracking-wide text-sm">{col.label}</span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${col.color}15`, color: col.color }}>{colIds.length}</span>
                    </div>
                    <div className="text-[10px] text-[#555] font-medium">{col.desc}</div>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-[#121212]' : ''}`}>
                        
                        {colIds.map((goalId, index) => {
                          const goal = getGoal(goalId)
                          if (!goal) return null
                          
                          const { completed, total } = getGoalProgress(goal.id, tasks)
                          
                          return (
                            <Draggable key={goalId} draggableId={goalId} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  className={`mb-3 p-4 bg-[#141414] border border-[#1E1E1E] rounded-xl cursor-grab active:cursor-grabbing select-none transition-all
                                    ${snapshot.isDragging ? 'shadow-2xl shadow-black/50 border-[#333] scale-[1.02] rotate-1' : 'hover:border-[#2a2a2a]'}
                                  `}
                                  style={{ ...provided.draggableProps.style, borderLeft: `3px solid ${goal.color}` }}>
                                  
                                  <div className="font-bold text-white text-sm leading-snug mb-3">
                                    {goal.name}
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${goal.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981]' : goal.status === 'paused' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-[#444]/20 text-[#666]'}`}>
                                      {goal.status}
                                    </span>
                                    
                                    <div className="flex items-center gap-1.5 text-[#555]" title="Tasks Completed">
                                      <CheckSquare size={13} style={{ color: total > 0 && completed === total ? '#10b981' : '#555' }} />
                                      <span className="text-xs font-bold tabular-nums" style={{ color: total > 0 && completed === total ? '#10b981' : '#888' }}>
                                        {completed}/{total}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                        
                        {colIds.length === 0 && !snapshot.isDraggingOver && (
                          <div className="h-24 flex items-center justify-center border-2 border-dashed border-[#1A1A1A] rounded-xl m-1">
                            <span className="text-[11px] text-[#444] font-medium tracking-wide">Drop goals here</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}

