import { Sparkles } from "lucide-react"; // icon similar to the one in your image

const IntervueBadge = () => {
  return (
    <div
      className="
        inline-flex items-center gap-2 
        px-4 py-2 
        rounded-full 
        bg-gradient-to-r from-[#7B5CFF] to-[#4C1DFF]
        text-white text-sm font-medium
        shadow-sm
      "
    >
      <Sparkles size={14} className="text-white" />
      <span>Intervue Poll</span>
    </div>
  );
};

export default IntervueBadge;
