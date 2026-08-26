interface StartMappingButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function StartMappingButton({
  disabled,
  loading,
  onClick,
}: StartMappingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading…
        </span>
      ) : (
        "Start Mapping →"
      )}
    </button>
  );
}
