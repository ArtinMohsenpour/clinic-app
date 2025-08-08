export default function AdminHeader({
  user,
  title,
  actions,
}: {
  user: { name: string; email: string };
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between bg-[#ffffff] border-none p-4 rounded-4xl shadow">
      {/* Left: Page title */}
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center space-x-4">
        {actions && <div>{actions}</div>}

        {/* User info */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
