type ResumeBannerProps = {
  onDismiss: () => void;
};

export function ResumeBanner({ onDismiss }: ResumeBannerProps) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      已恢复上次会话（本地存储）。{" "}
      <button
        type="button"
        onClick={onDismiss}
        className="font-medium underline underline-offset-2 hover:opacity-80"
      >
        知道了
      </button>
    </div>
  );
}
