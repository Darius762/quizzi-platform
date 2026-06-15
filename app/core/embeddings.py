from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import Chroma
from langchain.embeddings.base import Embeddings
from typing import List


class LocalEmbeddings(Embeddings):

    def __init__(self):
        print("   Se incarca modelul de embeddings local...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("   Model incarcat!")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, show_progress_bar=True)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode([text])
        return embedding[0].tolist()


def create_vector_store(chunks: List[str], pdf_name: str) -> Chroma:
    embeddings = LocalEmbeddings()
    vector_store = Chroma.from_texts(
        texts=chunks,
        embedding=embeddings,
        collection_name=pdf_name.replace(".pdf", "").replace(" ", "_")
    )
    print(f"   Vector store creat cu {len(chunks)} documente")
    return vector_store


def retrieve_relevant_chunks(vector_store: Chroma, topic: str, k: int = 5) -> List[str]:
    docs = vector_store.similarity_search(topic, k=k)
    return [doc.page_content for doc in docs]