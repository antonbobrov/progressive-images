/* eslint-disable no-alert */
import type { NextPage } from 'next';
import Head from 'next/head';
import {
    FormEvent, useCallback, useState,
} from 'react';

const Home: NextPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [outputFilesJson, setOutputFilesJson] = useState('');

    /**
     * Form change handler
     */
    const handleFormChange = useCallback((e: FormEvent) => {
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);

        const useJpeg = !!formData.get('jpeg');
        const useWebP = !!formData.get('webp');
        const useAvif = !!formData.get('avif');

        const inputFiles = formData.getAll('files') as File[];
        const outputFiles = inputFiles.map((file) => {
            const fileNameParts = file.name.split('.') || [];
            fileNameParts.pop();
            const fileName = fileNameParts.join('.');
            const result: {
                jpeg?: string;
                webp?: string;
                avif?: string;
            } = {};
            if (useJpeg) {
                result.jpeg = `${fileName}.jpeg`;
            }
            if (useWebP) {
                result.webp = `${fileName}.webp`;
            }
            if (useAvif) {
                result.avif = `${fileName}.avif`;
            }
            return result;
        });
        setOutputFilesJson(JSON.stringify(outputFiles));
    }, []);

    /**
     * Form submit handler
     */
    const submit = useCallback((e: FormEvent) => {
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        // request
        const response = fetch(form.action, {
            method: 'POST',
            body: formData,
        });
        response.then(async (fetchResult) => {
            const contentDispositionHeader = fetchResult.headers.get('content-disposition');
            if (contentDispositionHeader) {
                const filename = contentDispositionHeader.split('filename=')[1];
                const data = await fetchResult.blob();
                const blob = new Blob([data], { type: data.type || 'application/octet-stream' });
                const blobURL = window.URL.createObjectURL(blob);
                const tempLink = document.createElement('a');
                tempLink.style.display = 'none';
                tempLink.href = blobURL;
                tempLink.setAttribute('download', filename);
                if (typeof tempLink.download === 'undefined') {
                    tempLink.setAttribute('target', '_blank');
                }
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                setTimeout(() => {
                    window.URL.revokeObjectURL(blobURL);
                }, 100);
                setIsLoading(false);
            } else {
                fetchResult.json().then((result) => {
                    if (!result.success) {
                        alert(result.message);
                    } else {
                        alert('Success');
                    }
                    setIsLoading(false);
                })
                    .catch((error) => {
                        alert(error);
                        setIsLoading(false);
                    });
            }
        })
            .catch((error) => {
                alert(error);
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="container mt-4">
            <Head>
                <title>Progressive images</title>
            </Head>

            <main>
                <h1 className="h1">
                    Use progressive images
                </h1>

                {isLoading ? (
                    <div className="spinner-border mt-4" role="status">
                        <span className="sr-only" />
                    </div>
                ) : ''}

                <form
                    className="mt-4"
                    action="/api/files"
                    method="post"
                    encType="multipart/form-data"
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit(e);
                    }}
                    onChange={(e) => {
                        handleFormChange(e);
                    }}
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
                            accept=".jpg,.png,.jpeg"
                            required
                        />
                    </label>

                    <div className="mt-3">
                        <label htmlFor="quality" className="col-12 col-lg-6 col-xl-6">
                            Output quality
                            <input
                                className="form-control mt-2"
                                type="number"
                                name="quality"
                                id="quality"
                                defaultValue="80"
                                min="1"
                                max="100"
                            />
                        </label>
                    </div>
                    <div className="mt-3">
                        <label htmlFor="width" className="col-12 col-lg-6 col-xl-6">
                            Width (empty for original)
                            <input
                                className="form-control mt-2"
                                type="number"
                                name="width"
                                id="width"
                                defaultValue=""
                                min="1"
                            />
                        </label>
                    </div>

                    <div className="mt-3">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                value="true"
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
                                value="true"
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
                                value="true"
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
                        disabled={isLoading}
                    >
                        Process the files

                    </button>

                </form>

                {outputFilesJson
                    ? (
                        <>
                            <h2 className="mt-4">
                                JSON
                            </h2>
                            <pre className="mt-2">
                                <code>{outputFilesJson}</code>
                            </pre>

                        </>
                    ) : '' }

            </main>
        </div>
    );
};

export default Home;
