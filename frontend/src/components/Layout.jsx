import Sidebar from './Sidebar.jsx';

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
