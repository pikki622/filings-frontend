"""File node model for representing file system tree structure."""

from pydantic import BaseModel
from typing import Optional


class FileNode(BaseModel):
    """Represents a node in the file system tree.

    Can represent either a file or a folder. For folders, the `children`
    field contains nested FileNode instances. For files, `children` is None.
    """

    id: str
    name: str
    path: str
    type: str  # 'folder' or 'file'
    extension: Optional[str] = None
    size: Optional[int] = None
    modified: Optional[float] = None
    count: Optional[int] = None  # for folders - number of items
    children: Optional[list["FileNode"]] = None

    model_config = {"from_attributes": True}
