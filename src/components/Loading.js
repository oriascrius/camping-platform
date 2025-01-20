import { HashLoader } from "react-spinners";

const Loading = ({ isLoading = false }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
      <div className="bg-white/10 rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl backdrop-blur-md">
        <HashLoader
          color="#3498db"
          size={60}
          loading={true}
        />
        <span className="text-white text-lg font-semibold tracking-wider animate-pulse">
          Loading...
        </span>
      </div>
    </div>
  );
};

export default Loading; 