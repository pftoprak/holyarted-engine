import { LegalPage } from '../legal-page';

export const metadata = { title: 'Terms of Use — Holyarted' };

export default function TermsPage() {
  return <LegalPage eyebrow="Terms" title="A clear agreement for using Holyarted." updated="10 September 2026" sections={[
    { heading: 'Using Holyarted', body: 'You may use Holyarted for personal, lawful purposes. You are responsible for the information you provide and for keeping access to your account secure. Do not misuse the service, interfere with its operation or attempt to access another person’s account.' },
    { heading: 'Personal insights', body: 'Holyarted offers reflective, interpretive content for self-exploration. It does not provide medical, psychological, legal, financial or other professional advice, and it should not replace qualified professional support or your own judgment.' },
    { heading: 'Accounts', body: 'You must provide accurate account information and use an account you are authorized to access. We may restrict or close accounts used fraudulently, unlawfully or in ways that harm the service or other people.' },
    { heading: 'Memberships', body: 'Any paid plan, price, renewal period and cancellation terms will be shown before purchase. Paid features will only become available after payment services are separately activated. Consumer rights that cannot legally be excluded remain unaffected.' },
    { heading: 'Availability', body: 'We work to keep Holyarted reliable, but the service may occasionally change, pause or experience errors. To the extent permitted by law, Holyarted is provided without guarantees of uninterrupted availability or a particular outcome.' },
    { heading: 'Türkçe özet', body: 'Holyarted kişisel farkındalık amacıyla yorumlayıcı içerik sunar; profesyonel tavsiye değildir. Hizmeti yalnızca hukuka uygun biçimde ve kendi hesabınızla kullanmalısınız. Ücretli planların koşulları ödeme öncesinde ayrıca gösterilecektir.' },
  ]} />;
}
