// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import sharp from 'sharp';
import AdmZip from 'adm-zip';

const form = formidable({
    multiples: true,
    maxFileSize: 500 * 1024 * 1024,
    keepExtensions: true,
});

type Data = {
    success?: boolean;
    message?: string
}

type Settings = {
    quality: number;
    width: number | undefined;
    useJpeg: boolean;
    useWebP: boolean;
    useAvif: boolean;
}

type ProcessedSharpFile = {
    outputFileName: string;
    buffer: Buffer;
} | undefined;

type ProcessedFile = {
    fileName: string;
    originalFilename: string;
    jpeg: ProcessedSharpFile;
    webp: ProcessedSharpFile;
    avif: ProcessedSharpFile;
}

async function processSharpFile(
    file: formidable.File,
    settings: Settings,
    format: 'jpeg' | 'webp' | 'avif',
    fileName: string,
): Promise<ProcessedSharpFile> {
    let sharpFile = sharp(file.filepath);
    switch (format) {
        case 'jpeg':
            sharpFile = sharpFile.jpeg({
                quality: settings.quality,
                progressive: true,
            });
            break;
        case 'webp':
            sharpFile = sharpFile.webp({
                quality: settings.quality,
            });
            break;
        case 'avif':
            sharpFile = sharpFile.avif({
                quality: settings.quality,
            });
            break;
        default:
            break;
    }
    if (settings.width) {
        sharpFile.resize(settings.width);
    }
    const outputFileName = `${fileName}.${format}`;
    const buffer = await sharpFile.toBuffer();
    // await sharpFile.toFile(`./images/${outputFileName}`);
    return {
        outputFileName,
        buffer,
    };
}

async function processFile(
    file: formidable.File,
    settings: Settings,
): Promise<ProcessedFile | undefined> {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype || '')) {
        return undefined;
    }
    // process file name
    const fileNameParts = file.originalFilename?.split('.') || [];
    fileNameParts.pop();
    const fileName = fileNameParts?.join('.');
    if (!fileName) {
        return undefined;
    }
    // return files
    return {
        fileName,
        originalFilename: file.originalFilename || fileName,
        jpeg: settings.useJpeg ? await processSharpFile(file, settings, 'jpeg', fileName) : undefined,
        webp: settings.useWebP ? await processSharpFile(file, settings, 'webp', fileName) : undefined,
        avif: settings.useAvif ? await processSharpFile(file, settings, 'avif', fileName) : undefined,
    };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    if (req.method !== 'POST') {
        res.status(405).send({
            success: false,
            message: 'Only POST requests allowed',
        });
        return;
    }

    // get form data
    const formData = await new Promise<{
        fields: formidable.Fields;
        files: formidable.Files
    }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({
                fields,
                files,
            });
        });
    });
    // check if data not empty
    if (!formData) {
        res.status(200).send({
            success: false,
            message: 'Data is empty!',
        });
        return;
    }

    // get settings
    const settings: Settings = {
        quality: Math.min(Math.max(
            !Number.isNaN(parseInt(formData.fields.quality as string, 10))
                ? parseInt(formData.fields.quality as string, 10) : 80,
            0,
        ), 100),
        width: !!formData.fields.width
            && !Number.isNaN(parseInt(formData.fields.width as string, 10))
            ? Math.max(parseInt(formData.fields.width as string, 10), 1)
            : undefined,
        useJpeg: typeof formData.fields.jpeg === 'string',
        useWebP: typeof formData.fields.webp === 'string',
        useAvif: typeof formData.fields.avif === 'string',
    };

    // process files
    let processedFiles: (ProcessedFile | undefined)[];
    if (Array.isArray(formData.files.files)) {
        const promises = formData.files.files.map(
            (file) => processFile(file, settings),
        );
        processedFiles = await Promise.all(promises);
    } else {
        const promises = [processFile(formData.files.files, settings)];
        processedFiles = await Promise.all(promises);
    }
    processedFiles = processedFiles.filter((file) => !!file);

    // check if files are processed
    if (processedFiles.length === 0) {
        res.status(200).json({
            success: false,
            message: 'No files processed',
        });
        return;
    }

    // create archive
    const zip = new AdmZip();
    processedFiles.forEach((currentFile) => {
        const file = currentFile!;
        if (file.jpeg) {
            zip.addFile(file.jpeg.outputFileName, file.jpeg.buffer);
        }
        if (file.webp) {
            zip.addFile(file.webp.outputFileName, file.webp.buffer);
        }
        if (file.avif) {
            zip.addFile(file.avif.outputFileName, file.avif.buffer);
        }
    });
    const zipBuffer = zip.toBuffer();
    // zip.writeZip('./images/archive.zip');

    // send the archive
    res.setHeader('Content-Disposition', 'attachment; filename=images.zip');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', zipBuffer.length);
    res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=images.zip',
        'Content-Length': zipBuffer.length,
    });
    res.end(zipBuffer);
}

export const config = {
    api: {
        bodyParser: false,
    },
};
