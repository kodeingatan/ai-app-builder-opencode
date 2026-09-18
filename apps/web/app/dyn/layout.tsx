import AppLayout from "@/components/layout/AppLayout"
export default function DynLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
