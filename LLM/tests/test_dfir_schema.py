"""
DFIR Schema and Pydantic v2 Validation Tests
"""

import os
import json
import pytest
from jsonschema import validate, ValidationError
from app.models.dfir import DFIRDocument, DFIRNode, DFIRMetadata, DFIRTransform, DFIRLayout


def test_dashboard_example_conforms_to_json_schema():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schema_path = os.path.join(base_dir, "schema", "dfir.schema.json")
    example_path = os.path.join(base_dir, "schema", "DFIR_EXAMPLES", "dashboard_example.json")

    with open(schema_path, "r") as f:
        schema = json.load(f)
    with open(example_path, "r") as f:
        example_data = json.load(f)

    # Validates without raising ValidationError
    validate(instance=example_data, schema=schema)


def test_dashboard_example_conforms_to_pydantic_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    example_path = os.path.join(base_dir, "schema", "DFIR_EXAMPLES", "dashboard_example.json")

    with open(example_path, "r") as f:
        example_data = json.load(f)

    doc = DFIRDocument.model_validate(example_data)
    assert doc.version == "1.0.0"
    assert doc.metadata.title == "Enterprise Banking Dashboard"
    assert doc.root.type == "frame"
    assert len(doc.root.children) == 2
    assert doc.root.children[0].name == "Sidebar Navigation"
    assert doc.root.children[1].name == "Main Dashboard View"


def test_invalid_node_type_raises_validation_error():
    with pytest.raises(Exception):
        DFIRNode(
            id="bad_node",
            type="non_existent_type",  # invalid
            name="Invalid Node"
        )


def test_negative_dimensions_raise_validation_error():
    with pytest.raises(Exception):
        DFIRTransform(width=-100.0, height=200.0)


def test_text_node_auto_initializes_text_payload():
    node = DFIRNode(
        id="text_1",
        type="text",
        name="Header Title"
    )
    assert node.text is not None
    assert node.text.content == "Header Title"
