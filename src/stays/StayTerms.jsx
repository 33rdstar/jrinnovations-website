import React from 'react';
import { COMMISSION_PERCENT, TERMS_VERSION } from './stayConfig';

// DRAFT business terms for Yanga Stays. These must be reviewed by a lawyer
// before launch. If the wording changes in a way that matters, bump
// TERMS_VERSION (here and in the app's functions/stays.js) so each business's
// acceptance records which version they agreed to.
const StayTerms = ({ dark = false }) => (
  <div className={`text-sm space-y-3 leading-relaxed ${dark ? 'text-white/70 [&_strong]:text-white' : 'text-gray-700'}`}>
    <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>Version {TERMS_VERSION}</p>

    <p><strong>1. About these terms.</strong> These terms govern your use of Yanga Stays, a booking and payment service operated by JR Innovations ("Yanga"). By applying, you confirm you are authorised to act for the accommodation business named in your application ("the Business").</p>

    <p><strong>2. Yanga's role.</strong> Yanga provides the platform that lets guests find, book and pay for your accommodation. The contract for the stay is between the guest and the Business. Yanga is not the provider of the accommodation and is not responsible for the condition, safety or quality of the stay.</p>

    <p><strong>3. Approval.</strong> Your listing is not visible until Yanga has reviewed and approved your application. Yanga may refuse, suspend or remove a business at any time, including for inaccurate information, complaints, or breach of these terms.</p>

    <p><strong>4. Accuracy.</strong> You must keep your business details, location, photos, room descriptions, prices and availability accurate and up to date. You must honour every confirmed and paid booking at the price shown to the guest.</p>

    <p><strong>5. Service fee.</strong> Yanga keeps a service fee of <strong>{COMMISSION_PERCENT}%</strong> of the total price of each booking. The remaining {100 - COMMISSION_PERCENT}% is sent to the mobile money number you register, immediately after the guest's payment is confirmed. Your invoice for each booking shows the total, the fee and the amount paid to you. Mobile money network charges on the guest's payment are carried by Yanga.</p>

    <p><strong>6. Your payout number.</strong> You are responsible for giving a correct mobile money number registered in the Business's or the owner's name. Yanga is not liable for payments sent to the number you registered. To change the number you must contact Yanga.</p>

    <p><strong>7. Cancellations and refunds.</strong> <strong>Because the Business receives the guest's payment directly, any refund — including when the Business cancels, cannot provide the room, or agrees to cancel at the guest's request — is the Business's responsibility and must be paid by the Business directly to the guest.</strong> Yanga does not refund guests from the Business's share. Guests are told this clearly before they pay. If you cancel a booking in your dashboard, the room is released, but you must still arrange the full refund promptly.</p>

    <p><strong>8. Guest information.</strong> You will see each guest's name and contact number so you can prepare for and communicate about their stay. You may use this information only for that booking and must not share it, sell it or use it for marketing.</p>

    <p><strong>9. Conduct.</strong> You must not discriminate against guests, take payment for a booked stay outside Yanga to avoid the service fee, or list accommodation you do not have the right to offer.</p>

    <p><strong>10. Liability.</strong> To the extent the law allows, Yanga is not liable for losses arising from a stay, from a booking the Business fails to honour, or from interruptions to the platform or to mobile money services.</p>

    <p><strong>11. Owner or manager; changing hands.</strong> When you register you say whether you are the owner of the Business or a manager authorised by the owner, and you confirm you have the authority to act for it. Your login is tied to that role. If the owner or manager changes (for example through resignation, or because the owner can no longer act), the Business must tell Yanga. Yanga may then hand the Business to a new login after verifying the request, and will switch the previous login off and tell the previous contact. Yanga may also change the payout number only after confirming it with the Business.</p>

    <p><strong>12. Names, reports and suspension.</strong> Each business name can be registered once on Yanga Homes, and you must use your real trading name. Guests can report a listing they believe is false or unsafe. Yanga may review such reports and suspend a Business while it investigates.</p>

    <p><strong>13. Changes and governing law.</strong> Yanga may update these terms and will tell you when it does; continuing to use Yanga Stays means you accept the update. These terms are governed by the laws of the Republic of Zambia.</p>
  </div>
);

export default StayTerms;
