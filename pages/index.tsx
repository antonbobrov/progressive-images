import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => (
    <div className="container mt-4">
        <Head>
            <title>Progressive images</title>
        </Head>

        <main>
            <h1 className="h1">
                Use progressive images
            </h1>

            <form
                className="mt-4"
                action="/api/files"
                method="post"
            >

                <label
                    htmlFor="files"
                    className=""
                >
                    <input
                        type="file"
                        name="files"
                        id="files"
                        multiple
                    />
                </label>

                <div className="row mt-3">
                    <label htmlFor="quality" className="col">
                        Output quality
                        <input
                            className="form-control mt-2"
                            type="number"
                            name="quality"
                            id="quality"
                        />
                    </label>
                    <label htmlFor="speed" className="col">
                        Speed
                        <input
                            className="form-control mt-2"
                            type="number"
                            name="speed"
                            id="speed"
                        />
                    </label>
                </div>

                <div className="mt-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            value=""
                            id="checkbox-jpeg"
                            name="jpeg"
                            defaultChecked
                        />
                        <label
                            className="form-check-label"
                            htmlFor="checkbox-jpeg"
                        >
                            Use jpeg
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            value=""
                            id="checkbox-webp"
                            name="webp"
                            defaultChecked
                        />
                        <label
                            className="form-check-label"
                            htmlFor="checkbox-webp"
                        >
                            Use webp
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            value=""
                            id="checkbox-avif"
                            name="avif"
                            defaultChecked
                        />
                        <label
                            className="form-check-label"
                            htmlFor="checkbox-avif"
                        >
                            Use avif
                        </label>
                    </div>
                </div>

                <button
                    className="btn btn-primary mt-3"
                    type="submit"
                >
                    Process the files

                </button>

            </form>

        </main>
    </div>
);

export default Home;
