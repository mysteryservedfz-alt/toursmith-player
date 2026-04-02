import React from 'react';
import Icons from '../Icons';

const GalleryUrlsEditor = ({ urls = [], onChange }) => {
  const addUrl = () => onChange([...(urls || []), '']);
  const updateUrl = (index, value) => {
    const newUrls = [...(urls || [])];
    newUrls[index] = value;
    onChange(newUrls);
  };
  const removeUrl = (index) => {
    const newUrls = (urls || []).filter((_, i) => i !== index);
    onChange(newUrls.length > 0 ? newUrls : null);
  };

  return (
    <div className="gallery-urls-editor">
      {(urls || []).map((url, index) => (
        <div key={index} className="gallery-url-row">
          <input
            type="url"
            className="input"
            value={url}
            onChange={(e) => updateUrl(index, e.target.value)}
            placeholder={`Image URL ${index + 1}`}
          />
          <button type="button" onClick={() => removeUrl(index)} className="btn btn-ghost btn-sm">
            <Icons.Trash />
          </button>
        </div>
      ))}
      <button type="button" onClick={addUrl} className="btn btn-secondary btn-sm">
        <Icons.Plus /> Add Image
      </button>
    </div>
  );
};

export default GalleryUrlsEditor;
