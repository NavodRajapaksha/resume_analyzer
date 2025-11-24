import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

const FileUploader = () => {
    const onDrop = useCallback(acceptedFiles => {
    // Do something with the files
    }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div className='w-full gradient-border'>FileUploader</div>
  )
}

export default FileUploader