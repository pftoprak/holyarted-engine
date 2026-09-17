'use client';

import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const copy = {
  en: { title: 'Your data, your choice', download: 'Download my data', remove: 'Delete saved portrait', confirm: 'Delete your saved portrait?', description: 'This removes your saved portrait and its personal details from Holyarted. It cannot be undone. Your Google sign-in and membership remain unchanged.', cancel: 'Keep portrait', deleting: 'Deleting…', deleted: 'Your saved portrait was deleted.', failure: 'The request could not be completed. Please try again.', account: 'For account deletion, contact support@holyarted.com.' },
  tr: { title: 'Verilerin senin kontrolünde', download: 'Verilerimi indir', remove: 'Kayıtlı portreyi sil', confirm: 'Kayıtlı portren silinsin mi?', description: 'Kayıtlı portren ve ona ait kişisel bilgiler Holyarted’den silinir. Bu işlem geri alınamaz. Google girişin ve üyeliğin değişmez.', cancel: 'Portreyi sakla', deleting: 'Siliniyor…', deleted: 'Kayıtlı portren silindi.', failure: 'İşlem tamamlanamadı. Lütfen tekrar dene.', account: 'Hesap silme için support@holyarted.com adresine yazabilirsin.' },
};

export function AccountDataControls({ locale, hasPortrait, onDelete, onExport }: {
  locale: 'en' | 'tr';
  hasPortrait: boolean;
  onDelete: () => Promise<void>;
  onExport: () => Promise<Blob>;
}) {
  const text = copy[locale];
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function download() {
    setPending(true);
    setMessage('');
    try {
      const blob = await onExport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'holyarted-data.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setMessage(text.failure); }
    finally { setPending(false); }
  }

  async function remove() {
    setPending(true);
    setMessage('');
    try {
      await onDelete();
      setMessage(text.deleted);
      setOpen(false);
    } catch { setMessage(text.failure); }
    finally { setPending(false); }
  }

  return <div className="border-t border-[#625b55]/12 p-7 text-[#514b46] md:p-10">
    <h2 className="font-heading text-3xl">{text.title}</h2>
    <div className="mt-5 flex flex-wrap gap-3">
      <button disabled={pending} onClick={download} className="rounded-2xl border border-[#625b55]/22 px-5 py-3 text-sm font-bold disabled:opacity-50">{text.download}</button>
      {hasPortrait && <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger disabled={pending} className="rounded-2xl border border-[#9b5e55]/25 px-5 py-3 text-sm font-bold text-[#9b5e55]">{text.remove}</AlertDialogTrigger>
        <AlertDialogContent className="bg-[#fbf8f2] text-[#514b46]">
          <AlertDialogHeader><AlertDialogTitle>{text.confirm}</AlertDialogTitle><AlertDialogDescription>{text.description}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={pending}>{text.cancel}</AlertDialogCancel><AlertDialogAction disabled={pending} onClick={remove} className="bg-[#9b5e55] text-white">{pending ? text.deleting : text.remove}</AlertDialogAction></AlertDialogFooter>
          {message && <p role="status" className="text-sm">{message}</p>}
        </AlertDialogContent>
      </AlertDialog>}
    </div>
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
    <p className="mt-5 text-sm text-[#514b46]/58">{text.account}</p>
  </div>;
}
