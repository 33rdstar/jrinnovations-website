import React from 'react';
import { GraduationCap, Mail } from 'lucide-react';
import { useHost } from './HostContext';
import { COMMISSION_PERCENT } from '../stayConfig';

const QA = [
  ['How do I get paid?', `Each time a guest pays, Yanga keeps ${COMMISSION_PERCENT}% and sends the rest straight to your registered mobile money number. You can see every payment under Earnings.`],
  ['How do I stop guests booking certain dates?', 'Open Calendar, choose the room and the dates, and block them. Blocked nights cannot be booked in the app.'],
  ['How do I change my prices?', 'Open Rooms and edit the room. New prices apply to new bookings; bookings already paid keep the price the guest paid.'],
  ['How do I change my payout number or login email?', 'Open My business and use "Request a change" in the Payouts or Login email section. For your security Yanga will phone you on the number we already have before approving it.'],
  ['A guest needs to cancel. What do I do?', 'Open the booking and cancel it. The room is released, and you refund the guest yourself, as agreed in the terms you accepted.'],
  ['Why are some of my bookings "Under review"?', 'Something about the payment needed a check, for example it arrived after the room was taken. Yanga is sorting it out and will contact you if needed.'],
];

const HostHelp = () => {
  const { business } = useHost();
  const training = `mailto:yangamobile@gmail.com?subject=${encodeURIComponent('Free training request')}&body=${encodeURIComponent(`Hello Yanga,\n\nPlease arrange free training for ${business?.name || 'our business'} on using the Yanga Homes dashboard.\n\nBest times for us:\n`)}`;
  return (
  <div className="space-y-5 max-w-3xl">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Help</h1>
      <p className="text-sm text-gray-500">Answers to common questions, and how to reach us.</p>
    </div>

    <section className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
      {QA.map(([q, a]) => (
        <details key={q} className="p-4 group">
          <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between gap-3">{q}<span className="text-amber-500 group-open:rotate-45 transition-transform">+</span></summary>
          <p className="text-sm text-gray-600 mt-2">{a}</p>
        </details>
      ))}
    </section>

    <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
      <h2 className="font-bold text-emerald-900 flex items-center gap-2"><GraduationCap size={18} /> Free training</h2>
      <p className="text-sm text-gray-700 mt-1">
        Not sure where to start? Yanga offers free training to every business we register: how to add rooms and photos,
        keep your calendar right, read your earnings and get paid. Ask when you are ready and we will arrange a time with you.
      </p>
      <a href={training} className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm">Request free training</a>
    </section>

    <section className="bg-[#0D1B2A] text-white rounded-xl p-5">
      <h2 className="font-bold text-amber-400">Still need help?</h2>
      <p className="text-sm text-white/70 mt-1">Email the Yanga team from the address you sign in with and tell us your business name.</p>
      <a href="mailto:yangamobile@gmail.com?subject=Yanga%20Stays%20help" className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-amber-400 text-[#0D1B2A] font-semibold text-sm">
        <Mail size={16} /> yangamobile@gmail.com
      </a>
      <p className="text-xs text-white/50 mt-3">The business terms you accepted at registration explain fees, payouts and cancellations.</p>
    </section>
  </div>
  );
};

export default HostHelp;
