--
-- PostgreSQL database dump
--

\restrict rcEOrNE73Qoef7WyIMQRLk720xYN9GuimnrxZzHUkaA4ixrbDccdD2ScqdfSfI7

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.comments (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    content text,
    video_id bigint,
    author_id bigint
);


ALTER TABLE public.comments OWNER TO "user";

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO "user";

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: playlist_videos; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.playlist_videos (
    playlist_id bigint NOT NULL,
    video_id bigint NOT NULL
);


ALTER TABLE public.playlist_videos OWNER TO "user";

--
-- Name: playlists; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.playlists (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    user_id bigint
);


ALTER TABLE public.playlists OWNER TO "user";

--
-- Name: playlists_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.playlists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playlists_id_seq OWNER TO "user";

--
-- Name: playlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.playlists_id_seq OWNED BY public.playlists.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tags (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    name text NOT NULL
);


ALTER TABLE public.tags OWNER TO "user";

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO "user";

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    name text,
    surname text,
    email text,
    password text
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: video_playlists; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.video_playlists (
    video_id bigint NOT NULL,
    playlist_id bigint NOT NULL
);


ALTER TABLE public.video_playlists OWNER TO "user";

--
-- Name: video_tags; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.video_tags (
    tag_id bigint NOT NULL,
    video_id bigint NOT NULL
);


ALTER TABLE public.video_tags OWNER TO "user";

--
-- Name: videos; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.videos (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    title text,
    description text,
    url text,
    size bigint,
    mime_type text,
    upload_at text,
    author_id bigint,
    likes bigint DEFAULT 0
);


ALTER TABLE public.videos OWNER TO "user";

--
-- Name: videos_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.videos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.videos_id_seq OWNER TO "user";

--
-- Name: videos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.videos_id_seq OWNED BY public.videos.id;


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: playlists id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.playlists ALTER COLUMN id SET DEFAULT nextval('public.playlists_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: videos id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.videos ALTER COLUMN id SET DEFAULT nextval('public.videos_id_seq'::regclass);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: playlist_videos playlist_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.playlist_videos
    ADD CONSTRAINT playlist_videos_pkey PRIMARY KEY (playlist_id, video_id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: video_playlists video_playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.video_playlists
    ADD CONSTRAINT video_playlists_pkey PRIMARY KEY (video_id, playlist_id);


--
-- Name: video_tags video_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.video_tags
    ADD CONSTRAINT video_tags_pkey PRIMARY KEY (tag_id, video_id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: idx_comments_deleted_at; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_comments_deleted_at ON public.comments USING btree (deleted_at);


--
-- Name: idx_playlists_deleted_at; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_playlists_deleted_at ON public.playlists USING btree (deleted_at);


--
-- Name: idx_playlists_name; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX idx_playlists_name ON public.playlists USING btree (name);


--
-- Name: idx_tags_deleted_at; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_tags_deleted_at ON public.tags USING btree (deleted_at);


--
-- Name: idx_tags_name; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX idx_tags_name ON public.tags USING btree (name);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_videos_deleted_at; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_videos_deleted_at ON public.videos USING btree (deleted_at);


--
-- Name: playlist_videos fk_playlist_videos_playlist; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.playlist_videos
    ADD CONSTRAINT fk_playlist_videos_playlist FOREIGN KEY (playlist_id) REFERENCES public.playlists(id);


--
-- Name: playlist_videos fk_playlist_videos_video; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.playlist_videos
    ADD CONSTRAINT fk_playlist_videos_video FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- Name: videos fk_users_videos; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT fk_users_videos FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: video_playlists fk_video_playlists_playlist; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.video_playlists
    ADD CONSTRAINT fk_video_playlists_playlist FOREIGN KEY (playlist_id) REFERENCES public.playlists(id);


--
-- Name: video_playlists fk_video_playlists_video; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.video_playlists
    ADD CONSTRAINT fk_video_playlists_video FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- Name: video_tags fk_video_tags_tag; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.video_tags
    ADD CONSTRAINT fk_video_tags_tag FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: video_tags fk_video_tags_video; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.video_tags
    ADD CONSTRAINT fk_video_tags_video FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- Name: comments fk_videos_comments; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_videos_comments FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rcEOrNE73Qoef7WyIMQRLk720xYN9GuimnrxZzHUkaA4ixrbDccdD2ScqdfSfI7

