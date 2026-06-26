import fitz
class PDFParser:
    @staticmethod
    def extract(self,file):
        text = ''
        try:
            pdf = fitz.open(stream=file.read(), filetype="pdf")

            for page in pdf:
                text += page.read()
            pdf.close()
            return text
        except Exception as e:
            print(f"error {e}")


from docx import Document


class DOCXParser:

    @staticmethod
    def extract(file):

        doc = Document(file)

        text = "\n".join(
            [paragraph.text for paragraph in doc.paragraphs]
        )

        return text




class InputProcessor:

    @staticmethod
    def process(self, file = None, text=None):
        if text:
            return text
        
        if file.name.endsWith(".pdf"):
            return PDFParser.extract(file)
        
        if file.name.endsWith(".docx"):
            return DOCXParser.extract(file)