-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector
with
  schema extensions;

-- Create chat_agents table
create table if not exists
  public.chat_agents (
    id uuid primary key default gen_random_uuid (),
    user_id text not null,
    name text not null,
    role text not null,
    personality text not null,
    model text not null,
    created_at timestamp with time zone default timezone ('utc'::text, now()) not null
  );

-- Create agent_documents table
create table if not exists
  public.agent_documents (
    id uuid primary key default gen_random_uuid (),
    agent_id uuid references public.chat_agents (id) on delete cascade not null,
    file_name text not null,
    file_size integer not null,
    content text not null,
    created_at timestamp with time zone default timezone ('utc'::text, now()) not null
  );

-- Create document_chunks table with vector embeddings
create table if not exists
  public.document_chunks (
    id uuid primary key default gen_random_uuid (),
    document_id uuid references public.agent_documents (id) on delete cascade not null,
    agent_id uuid references public.chat_agents (id) on delete cascade not null,
    content text not null,
    embedding vector (384),
    created_at timestamp with time zone default timezone ('utc'::text, now()) not null
  );

-- Create a function to match document chunks via similarity search
create or replace function match_document_chunks (
  query_embedding vector (384),
  match_threshold float,
  match_count int,
  filter_agent_id uuid
) returns table (
  id uuid,
  content text,
  similarity float
) language sql stable as $$
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where document_chunks.agent_id = filter_agent_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
