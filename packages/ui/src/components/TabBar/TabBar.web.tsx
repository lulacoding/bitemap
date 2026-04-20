export interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

export interface TabBarProps {
  tabs: readonly TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  onReportPress?: () => void;
  reportIndex?: number;
}

export function TabBar({
  tabs,
  activeKey,
  onSelect,
  onReportPress,
  reportIndex = 2,
}: TabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t border-gray-200 bg-white"
    >
      {tabs.map((tab, i) => {
        if (i === reportIndex && onReportPress) {
          return (
            <button
              key="__report__"
              type="button"
              aria-label="Report a catch"
              onClick={onReportPress}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-pill bg-tertiary text-white shadow-lg"
            >
              +
            </button>
          );
        }
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-2 text-xs ${
              active ? 'text-primary' : 'text-gray-500'
            }`}
          >
            {tab.icon ? <span aria-hidden="true">{tab.icon}</span> : null}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
