import type { OrderTimelineEntry } from "../../types/domain";

interface OrderTimelineProps {
  timeline: OrderTimelineEntry[];
}

const ALL_STAGES = [
  { status: "Submitted", icon: "send", label: "Submitted" },
  { status: "Approved", icon: "thumb_up", label: "Pending Approval" },
  { status: "Fulfilled", icon: "check_circle", label: "Fulfilled" },
];

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (!timeline.length) {
    return <p className="text-slate-500 text-center py-4">No timeline activity yet.</p>;
  }

  // Find if the order was rejected
  const rejectedEntry = timeline.find(t => t.status === "Rejected");
  
  // If rejected, we'll replace the normal stages after submission with the rejection
  const stagesToShow = rejectedEntry 
    ? [
        ALL_STAGES[0], 
        { status: "Rejected", icon: "cancel", label: "Rejected" }
      ]
    : ALL_STAGES;

  // Find the latest status in the timeline
  const currentStatus = timeline[timeline.length - 1].status;
  
  // Calculate progress percentage for the timeline bar
  let progress = 0;
  let barColor = "bg-primary";
  if (currentStatus === "Submitted") {
    progress = 0;
  }
  else if (currentStatus === "Approved") {
    progress = 50;
  }
  else if (currentStatus === "Fulfilled") {
    progress = 100;
  }
  else if (currentStatus === "Rejected") {
    progress = 100;
  }
  
  return (
    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-0 w-full max-w-3xl mx-auto">
      {/* Timeline Bar (Desktop) */}
      <div className="hidden md:block absolute top-5 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-0">
        <div 
          className={`h-full transition-all duration-500 ${barColor}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {stagesToShow.map((stage) => {
        // Find if this stage exists in the actual timeline data
        const timelineEntry = timeline.find(t => t.status === stage.status);
        
        // A stage is completed if it exists in the timeline AND it's not the last item in the timeline
        // Or if it's the current active stage
        const isReached = !!timelineEntry;
        const isCurrent = currentStatus === stage.status;
        
        // If we are at "Submitted", the "Approved" step should show as "Pending Approval" (not reached yet)
        const displayLabel = stage.status === "Approved" && !isReached ? "Pending Approval" : 
                            stage.status === "Approved" && isReached ? "Approved" : 
                            stage.label;

        let colorClass = "";
        let textColorClass = "";
        
        if (isCurrent) {
          // Current active step
          // If it's the final step (Fulfilled or Rejected), we want it solid filled, not outlined
          if (stage.status === "Fulfilled" || stage.status === "Rejected") {
            colorClass = "bg-primary text-white ring-4 ring-slate-50 dark:ring-white/5";
            textColorClass = "text-slate-900 dark:text-white";
          } else {
            colorClass = "bg-background-light dark:bg-background-dark border-4 border-primary text-primary ring-4 ring-slate-50 dark:ring-white/5";
            textColorClass = "text-primary";
          }
        } else if (isReached) {
          // Completed step
          colorClass = "bg-primary text-white ring-4 ring-slate-50 dark:ring-white/5";
          textColorClass = "text-slate-900 dark:text-white";
        } else {
          // Future step - grayed out
          colorClass = "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 ring-4 ring-slate-50 dark:ring-white/5 opacity-50";
          textColorClass = "text-slate-400 dark:text-slate-500";
        }

        return (
          <div key={stage.status} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-2 group">
            <div className={`size-10 rounded-full flex items-center justify-center transition-all ${colorClass}`}>
              <span className="material-symbols-outlined text-sm">{stage.icon}</span>
            </div>
            <div className="text-left md:text-center w-32">
              <p className={`font-bold text-sm ${textColorClass}`}>
                {displayLabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
