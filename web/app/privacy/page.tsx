import { LegalPage } from '../legal-page';

export const metadata = { title: 'Privacy Policy — Holyarted' };

export default function PrivacyPage() {
  return <LegalPage eyebrow="Privacy" title="Your information, handled with care." updated="10 September 2026" sections={[
    { heading: 'What we collect', body: 'When you create a personal portrait, you may provide your name and date of birth. If you sign in, Google and our authentication provider supply basic account details such as your name, email address and account identifier. We also receive limited technical information needed to operate and protect the service.' },
    { heading: 'How we use it', body: 'We use your information to create and display your personal portrait, maintain your account, remember your membership, respond to support requests, prevent misuse and improve the service. We do not sell your personal information.' },
    { heading: 'Service providers', body: 'Holyarted relies on carefully selected providers for hosting, authentication and infrastructure. They process information only as needed to provide their services to us. Google sign-in is subject to Google’s own privacy practices.' },
    { heading: 'Retention & security', body: 'We keep account information only for as long as needed to provide the service, meet legal obligations and resolve disputes. We use reasonable safeguards, but no online service can guarantee absolute security.' },
    { heading: 'Your choices', body: 'You may sign out at any time. You can request access, correction or deletion of your account information by contacting support@holyarted.com. We may need to verify your identity before completing a request.' },
    { heading: 'Türkçe özet', body: 'Ad, doğum tarihi ve Google hesabından gelen temel profil bilgileri; kişisel portrenizi oluşturmak, hesabınızı işletmek ve hizmeti güvenli tutmak amacıyla işlenir. Verilerinizi satmayız. Erişim, düzeltme veya silme talebi için support@holyarted.com adresine yazabilirsiniz.' },
  ]} />;
}
