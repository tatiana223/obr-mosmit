import type { DocumentItem } from '../api/documentsApi';
import { Link } from 'react-router-dom';
type Props = {
    item: DocumentItem;
    file?: DocumentItem['attachments'][number];
    className?: string;
    children?: React.ReactNode;
};
export function DocumentFileLink({ item, file: selectedFile, className, children }: Props) {
    const file = selectedFile ?? item.attachments[0];
    if (!file)
        return <Link className={className} to={`/dokumenty/${item.id}`}>{children ?? 'Читать →'}</Link>;
    const isPdf = file.url.split(/[?#]/)[0].toLowerCase().endsWith('.pdf');
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isPdf && !window.confirm(`Скачать файл «${file.title || item.title}»?`))
            event.preventDefault();
    };
    return <a className={className} href={file.url} target={isPdf ? '_blank' : undefined} rel={isPdf ? 'noreferrer' : undefined} download={isPdf ? undefined : file.title || true} onClick={handleClick}>{children ?? (isPdf ? 'Открыть PDF →' : 'Скачать файл →')}</a>;
}
