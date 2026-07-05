from bson import ObjectId


def serialize_doc(doc):
    """
    Convert a MongoDB document into something jsonify() can actually output.
    MongoDB's ObjectId isn't JSON-serializable on its own, so this walks the
    document (including nested dicts/lists) and turns every ObjectId into a
    plain string.
    """
    if doc is None:
        return None

    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, list):
            result[key] = [
                serialize_doc(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result
