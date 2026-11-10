# This Endoscopy Does Not Exist

10,000 random synthetic endoscopy images from an unconditional StyleGAN2 model trained from scratch at 512×512. The checkpoint at 16,329,664 presentations achieved official FID 4.9499.

Every visit and refresh makes a fresh browser cryptographic random choice across the pool. Only the immediately previous image is excluded, giving each other image an equal chance. Rejection sampling avoids modulo bias. There is no fixed image sequence, stored shuffle queue, or visitor identifier used for selection.

The pool uses 10,000 unique uniform uint32 seeds frozen before inference. All first outputs are retained without filtering or replacement. Generation uses standard Gaussian latent vectors, truncation psi 1, constant StyleGAN noise, and the assessed checkpoint. The public site serves saved samples without live GPU inference.

Full-color JPEG delivery copies (quality 93, no chroma subsampling) retain the complete 512×512 field. Original PNGs remain on authorized HPC storage. Generated images are separate release assets and remain out of Git. No training images, real evaluation images, participant identities, internal QA or model weights are published.

StyleGAN2 implementation and upstream license: https://github.com/NVlabs/stylegan2-ada-pytorch . Model code and weights are not redistributed here.

To keep large Pages deployments efficient, the exact JPEG bytes are packaged in 100 static chunks. The browser requests only the selected image byte range and checks its SHA256. If a host ignores Range, the loader slices the selected image from the returned chunk before verifying it. Image selection and pixel data are unchanged by this packaging.
