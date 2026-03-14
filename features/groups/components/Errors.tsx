import { AlertCircle, SearchX } from "lucide-react";

interface GroupDetailErrorProps {
  message: string;
  onRetry?: () => void;
}

const GroupDetailError = ({ message, onRetry }: GroupDetailErrorProps) => {
  return (
    <div className="p-4 lg:p-10">
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-sm font-medium text-red-600 mb-1">
          Something went wrong
        </p>
        <p className="text-sm text-slate-500 mb-6 max-w-md">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

const GroupNotFound = () => {
  return (
    <div className="p-4 lg:p-10">
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <SearchX className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">
          Group not found
        </p>
        <p className="text-sm text-slate-400 max-w-md">
          This group may have been removed or you don’t have access to it.
        </p>
      </div>
    </div>
  );
};

export { GroupDetailError, GroupNotFound };
