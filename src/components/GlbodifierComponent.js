import React, { useState } from 'react'
import { modifyGLB } from './Glbmodifer';

function GlbodifierComponent({ conversionResults }) {
    const [modifiedFiles, setModifiedFiles] = useState([]);

    // const handleModifyGLB = async () => {
    //     const modifiedResults = await Promise.all(conversionResults.map(async (result) => {
    //         try {
    //             const response = await fetch(result.convertedFilePath);
    //             const blob = await response.blob();
                
    //             console.log(`Original size of ${result.convertedFileName}: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
                
    //             const modifiedBlob = await modifyGLB(blob);
                
    //             console.log(`Modified size of ${result.convertedFileName}: ${(modifiedBlob.size / 1024 / 1024).toFixed(2)} MB`);
                
    //             const modifiedUrl = URL.createObjectURL(modifiedBlob);
    //             return {
    //                 ...result,
    //                 modifiedUrl,
    //                 modifiedFileName: `modified_${result.convertedFileName}`
    //             };
    //         } catch (error) {
    //             console.error(`Error modifying ${result.convertedFileName}:`, error);
    //             return null;
    //         }
    //     }));
    
    //     setModifiedFiles(modifiedResults.filter(result => result !== null));
    // };

    const handleModifyGLB = async () => {
        const modifiedResults = await Promise.all(conversionResults.map(async (result) => {
            try {
                const response = await fetch(result.convertedFilePath);
                const blob = await response.blob();
                
                const modifiedBlob = await modifyGLB(blob);
                
                const modifiedUrl = URL.createObjectURL(modifiedBlob);
                return {
                    ...result,
                    modifiedUrl,
                    modifiedFileName: `modified_${result.convertedFileName}`
                };
            } catch (error) {
                console.error(`Error modifying ${result.convertedFileName}:`, error);
                return null;
            }
        }));
    
        setModifiedFiles(modifiedResults.filter(result => result !== null));
    };


    // const handleModifyGLB = async () => {
    //     const modifiedResults = await Promise.all(conversionResults.map(async (file) => {
    //         try {
    //             const modifiedBlob = await modifyGLB(file);
                
    //             const modifiedUrl = URL.createObjectURL(modifiedBlob);
    //             return {
    //                 originalFileName: file.name,
    //                 modifiedFileName: `modified_${file.name.replace('.glb', '')}.glb`,
    //                 originalSize: file.size,
    //                 modifiedSize: modifiedBlob.size,
    //                 modifiedUrl
    //             };
    //         } catch (error) {
    //             console.error(`Error modifying ${file.name}:`, error);
    //             return null;
    //         }
    //     }));
    
    //     setModifiedFiles(modifiedResults.filter(result => result !== null));
    // };
    return (
        <div>
            <button onClick={handleModifyGLB}>Modify GLB Files</button>
            <ul>
                {modifiedFiles.map((file, index) => (
                    <li key={index}>
                        <a href={file.modifiedUrl} download={file.modifiedFileName}>
                            {file.modifiedFileName}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default GlbodifierComponent