
export function useDocumentTitle() {
    
    function setTitle(title: string) {
        document.title = `${title}`;
    }

    return setTitle;
}