import type { ReactNode } from 'react';

interface HotelSettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function HotelSettingsCard({ title, description, children, footer }: HotelSettingsCardProps) {
  return (
    <section className="flex flex-col gap-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold leading-tight text-[#1F2A30]">{title}</h2>
        <p className="text-sm leading-relaxed text-[#5C6670]">{description}</p>
      </header>
      {children}
      {footer && <div className="flex justify-end border-t border-[#E2E8F0] pt-5">{footer}</div>}
    </section>
  );
}

export function FormAlert({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
      {message}
    </p>
  );
}
